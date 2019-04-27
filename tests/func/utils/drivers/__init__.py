from ..extension import Extension

from . import firefox, chrome


WD_WRAPPERS = {}


def release():
    for wrapper in WD_WRAPPERS.values():
        wrapper.release()


def get_driver(name):
    wrappers = {
        'firefox': firefox.Wrapper,
        'chrome': chrome.Wrapper,
    }
    wrapper = WD_WRAPPERS.get(name, None)

    if not wrapper:
        WD_WRAPPERS[name] = wrappers[name](Extension())
        wrapper = WD_WRAPPERS[name]
        # Force the driver to retry all DOM operations up to N seconds.
        wrapper.driver.implicitly_wait(10)

    return wrapper.driver
