import json
import os
from os import path

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

        print('Loading addon from "{}"'.format(self._ext.packed_path))
        self._driver.install_addon(self._ext.packed_path, temporary=True)
        print('Driver installed add-on')
