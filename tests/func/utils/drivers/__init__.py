from ..extension import Extension

from . import firefox, chrome


WD_WRAPPERS = {}


def release():
    for wrapper in WD_WRAPPERS.values():
        wrapper.release()


def get_driver(name, headless=True):
    wrappers = {
        'firefox': firefox.Wrapper,
        'chrome': chrome.Wrapper,
    }
    wrapper = WD_WRAPPERS.get(name, None)

    if not wrapper:
        WD_WRAPPERS[name] = wrappers[name](Extension(), headless=headless)
        wrapper = WD_WRAPPERS[name]

    return wrapper
