import copy
import os
import psutil
import pytest
from selenium import webdriver
import subprocess
import sys
import time

from .func.utils import drivers
from .func.utils.bmc import BmcController
from .func.utils import support


def pytest_addoption(parser):
    parser.addoption("--browser", action="append", default=[],
                     help="List of webbrowsers to test (firefox, chrome)")
    parser.addoption("--reader", action="append", default=[],
                     help="List of readers to test, see module names in tests/func/utils/support/")
    parser.addoption("--dbg-website", action="store_true", default=False,
                     help="Set to display test-website debug logs")


def exit_with_error(err):
    print(err)
    exit(1)


def pytest_generate_tests(metafunc):
    """
        Generates `controller` and `reader_driver` fixtures, according to the
        CLI options provided by the user.
    """
    print('')  # For logging clarity
    if 'controller' in metafunc.fixturenames:
        browsers = metafunc.config.getoption('browser')
        if not browsers:
            browsers = ['firefox', 'chrome']
        browsers = sorted(set(browsers))
        controllers = [BmcController(drivers.get_driver(browser))
                       for browser in browsers]
        metafunc.parametrize('controller', controllers, ids=browsers)

    if 'reader_driver' in metafunc.fixturenames:
        readers = metafunc.config.getoption('reader')
        default_readers = [driver_name for driver_name in support.drivers]
        if not readers:
            readers = default_readers
        else:
            for reader in readers:
                if reader not in default_readers:
                    exit_with_error("Unknown reader `{}`. Aborting.".format(reader))
        metafunc.parametrize('reader_driver', sorted(set(readers)),
                             ids=sorted(set(readers)), indirect=True)


@pytest.fixture(scope='session')
def do_debug(request):
    return request.config.getoption("--dbg-website")

@pytest.fixture(scope='session')
def test_website(do_debug):
    # Insert logic specific to our custom sample website for
    # full-featured & stable tests
    # => Runs the flask website, and stop it once all tests have completed.
    env = copy.deepcopy(os.environ)
    env['FLASK_APP'] = './static-website/server'
    with subprocess.Popen(['flask', 'run'],
                          env=env,
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        sys.stderr.write('Started flask app in background...\n')
        proc_ps = psutil.Process(proc.pid)
        retries = 0
        while retries < 10:
            if conns := proc_ps.connections():
                if (len(conns) == 1
                        and conns[0].status == 'LISTEN'
                        and conns[0].laddr.port == 5000):
                    break
            time.sleep(1)
            retries += 1
        if retries == 10:
            raise RuntimeError('Small local website did not listen in time for tests')
        yield proc
        sys.stderr.write('Stopping flask app...\n')
        # Stop the FLASK server and collect its logs for the tests' outputs
        proc.terminate()
        stdout, stderr = proc.communicate()
        if do_debug and stdout:
            sys.stderr.write('**** Small Website Output ****\n')
            sys.stderr.write(stdout.decode() + '\n')
        if do_debug and stderr:
            sys.stderr.write('**** Small Website Error logs ****\n')
            sys.stderr.write(stderr.decode() + '\n')
        if do_debug and (stdout or stderr):
            sys.stderr.write('**** End of Small Website Logs ****\n')



@pytest.fixture
def reader_driver(controller, request, test_website):
    """
        Definition of the actual reader_driver fixture, controller by the user
        input (CLI).

        It is called by metafunc.parametrize in `pytest_generate_tests`, using
        the indirect flag, which explains why it is defined as a function as
        opposed to the `controller` fixture.
    """
    return support.drivers[request.param](controller.wrapped_driver)


@pytest.fixture
def unique_reader(controller, test_website):
    """
        This fixture instanciates a unique reader_driver to drive all the
        web-extension tests which are not specifically tied to validating a
        support module.

        This allows selecting (hardcoded here) a single reader as the main test
        target for generic web-extension features.
    """
    return support.drivers['localhost'](controller.wrapped_driver)


@pytest.fixture(autouse=True)
def before_tests(controller):
    yield
    controller.reset()


def pytest_sessionfinish(session, exitstatus):
    # Ensure all drivers are exited before we exit py.test
    drivers.release()


def pytest_exception_interact(node, call, report):
    if ('Module' in repr(node)):
        print('\n=== MODULE ERROR ===')
        print(node.obj)
        print('=== END OR MODULE ERROR ===')
    elif hasattr(node, "funcargs") and 'controller' in node.funcargs:
        controller = node.funcargs['controller']
        if report.failed:
            controller.driver.save_screenshot('/tmp/test-failed.png')
        if report.failed and isinstance(controller.driver, webdriver.Chrome):
            # Retrieve test's browser logs through the webdriver
            s = '\n'.join([
                str(line) for line in
                controller.driver.get_log('browser')
            ])
            if len(s) > 0:
                print('\n=== CONSOLE LOGS ===')
                print(s)
                print('=== END OF CONSOLE LOGS ===')
    else:
        print(call)
