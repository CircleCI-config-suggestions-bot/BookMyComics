import json
import os
from os import path


class BaseWebdriverWrapper:
    def __init__(self, extension):
        self._ext = extension

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
