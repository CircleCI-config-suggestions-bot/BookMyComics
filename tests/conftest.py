from .func.utils import drivers
from .func.utils.bmc import BmcController

from selenium import webdriver


def pytest_addoption(parser):
    parser.addoption("--browser", action="append", default=[],
                     help="List of webbrowsers to test (firefox, chrome)")


def pytest_generate_tests(metafunc):
    if 'controller' in metafunc.fixturenames:
        browsers = metafunc.config.getoption('browser')
        if not browsers:
            browsers = ['firefox', 'chrome']
        browsers = sorted(set(browsers))
        controllers = [BmcController(drivers.get_driver(browser))
                       for browser in browsers]
        metafunc.parametrize('controller', controllers, ids=browsers)


def pytest_exception_interact(node, call, report):
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


def pytest_sessionfinish(session, exitstatus):
    # Ensure all drivers are exited before we exit py.test
    drivers.release()
