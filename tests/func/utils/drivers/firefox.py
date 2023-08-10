from os import path

from selenium import webdriver

from .base import BaseWebdriverWrapper


class Wrapper(BaseWebdriverWrapper):
    def __init__(self, *args, **kwargs):
        super(Wrapper, self).__init__(*args, **kwargs)

        options = webdriver.FirefoxOptions()
        if self._headless:
            options.add_argument('-headless')

        # Now prepare args to instanciate the Selenium WebDriver,
        # including snapd distribution support
        driver_args = {'options': options}
        if self.distributed_via_snap('firefox', 'geckodriver'):
            options.binary_location = path.join(
                self._snap_prefix,
                'firefox/current/usr/lib/firefox/firefox-bin'
            )
            driver_args['service'] = webdriver.firefox.service.Service(
                executable_path=path.join(
                    self._snap_prefix,
                    'firefox/current/usr/lib/firefox/geckodriver',
                ),
            )

        self._driver = webdriver.Firefox(**driver_args)

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
        js_scroll_command = 'window.scrollTo({},{});'.format(loc['x'] - wsz['width']/2,
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
