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
        WD_WRAPPERS[name] = wrappers[name]('./web-extensions/chrome')
        wrapper = WD_WRAPPERS[name]

    return wrapper.driver
