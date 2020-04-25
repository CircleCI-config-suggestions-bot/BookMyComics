from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

from .base import BaseWebdriverWrapper


class Wrapper(BaseWebdriverWrapper):
    def __init__(self, *args, **kwargs):
        super(Wrapper, self).__init__(*args, **kwargs)

        options = webdriver.FirefoxOptions()
        options.add_argument('-headless')

        capabilities = DesiredCapabilities.FIREFOX
        capabilities['marionette'] = True

        self._driver = webdriver.Firefox(options=options,
                                         capabilities=capabilities)

        print('[Firefox] Loading addon from "{}"'.format(self._ext.packed_path))
        print('[Firefox] Loading manifest from "{}"'.format(self._ext._manifest_path))
        self._driver.install_addon(self._ext.packed_path, temporary=True)

    def ensure_click(self, element):
        """
            Ensures that the element is clickable (within viewport) then clicks
            on it.
        """
        loc = element.location
        wsz = self._driver.get_window_size()
        js_scroll_command = 'window.scrollTo({},{});' .format(loc['x'] - wsz['width']/2,
                                                              loc['y'] - wsz['height']/2)
        self._driver.execute_script(js_scroll_command)

    def clear_storage(self):
        """
            Clears local & session storage from the browser
        """
        self._driver.execute_script(
            "(chrome || window.chrome || browser || window.browser)"
            ".storage.local.clear().catch(e=>{}).then(()=>{});")
        self._driver.execute_script(
            "(chrome || window.chrome || browser || window.browser)"
            ".storage.sync.clear().catch(e=>{}).then(()=>{});")
