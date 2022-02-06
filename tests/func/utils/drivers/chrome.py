from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

from .base import BaseWebdriverWrapper

class Wrapper(BaseWebdriverWrapper):

    def __init__(self, *args, **kwargs):
        super(Wrapper, self).__init__(*args, **kwargs)

        capabilities = DesiredCapabilities.CHROME
        capabilities['loggingPrefs'] = {'browser': 'ALL'}

        options = webdriver.ChromeOptions()
        options.add_argument('--load-extension={}'.format(self._ext.unpacked_path))
        options.headless = False
        # Attempt to fix driver.get() getting stuck during tests.
        options.add_argument('--disable-browser-side-navigation')

        print('[Chrome] Loading addon from "{}"'.format(self._ext.unpacked_path))
        print('[Chrome] Loading manifest from "{}"'.format(self._ext._manifest_path))
        self._driver = webdriver.Chrome(options=options,
                                        desired_capabilities=capabilities)

    def ensure_click(self, element):
        """
            Ensures that the element is clickable (within viewport) then clicks
            on it.
        """
        ActionChains(self._driver).move_to_element(element).perform()
        element.click()

    def clear_storage(self):
        """
            Clears local & session storage from the browser
        """
        self._driver.execute_script(
            "(chrome || window.chrome || browser || window.browser)"
            ".storage.local.clear(()=>{});")
        self._driver.execute_script(
            "(chrome || window.chrome || browser || window.browser)"
            ".storage.sync.clear(()=>{});")
