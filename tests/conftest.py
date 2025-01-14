import pytest
from selenium import webdriver

from .func.utils import drivers
from .func.utils.bmc import BmcController
from .func.utils import support


def pytest_addoption(parser):
    parser.addoption("--browser", action="append", default=[],
                     help="List of webbrowsers to test (firefox, chrome)")
    parser.addoption("--reader", action="append", default=[],
                     help="List of readers to test, see module names in tests/func/utils/support/")


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
        metafunc.parametrize('reader_driver', sorted(set(readers)), ids=sorted(set(readers)), indirect=True)


@pytest.fixture
def reader_driver(controller, request):
    """
        Definition of the actual reader_driver fixture, controller by the user
        input (CLI).

        It is called by metafunc.parametrize in `pytest_generate_tests`, using
        the indirect flag, which explains why it is defined as a function as
        opposed to the `controller` fixture.
    """
    return support.drivers[request.param](controller.wrapped_driver)


@pytest.fixture
def unique_reader(controller):
    """
        This fixture instanciates a unique reader_driver to drive all the
        web-extension tests which are not specifically tied to validating a
        support module.

        This allows selecting (hardcoded here) a single reader as the main test
        target for generic web-extension features.
    """
    return support.drivers['manganato'](controller.wrapped_driver)


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
    elif hasattr(node, "funcargs"):
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
