import pytest

from .utils import drivers


def pytest_addoption(parser):
    parser.addoption("--browser", action="append", default=[],
                     help="List of webbrowsers to test (firefox, chrome)")


def pytest_generate_tests(metafunc):
    if 'webdriver' in metafunc.fixturenames:
        browsers = metafunc.config.getoption('browser')
        if not browsers:
            browsers = ['firefox', 'chrome']
        browsers = sorted(set(browsers))
        webdrivers = [drivers.get_driver(browser) for browser in browsers]
        metafunc.parametrize('webdriver', webdrivers)


def pytest_sessionfinish(session, exitstatus):
    # Ensure all drivers are exited before we exit py.test
    drivers.release()
