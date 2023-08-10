import os
from os import path


class BaseWebdriverWrapper:
    def __init__(self, extension, headless=True):
        self._headless = headless
        self._ext = extension
        # Used to handle snap support
        self._snap_prefix = None

    @property
    def driver(self):
        """
            This property returns the configured webdriver instance
        """
        return self._driver

    def release(self):
        """
            This property releases (quits) the underlying webdriver
        """
        self.driver.quit()

    def distributed_via_snap(self, exe_name, driver_name):
        candidates = [prefix
                      for prefix in os.environ['PATH'].split(':')
                      if '/snap/bin' in prefix]
        for prefix in candidates:
            if (
                path.exists(path.join(prefix, exe_name))
                and path.exists(path.join(prefix, driver_name))
            ):
                self._snap_prefix = path.dirname(prefix)
                return True
        return False
