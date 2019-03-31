import json
import os
from os import path

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

from .base import BaseWebdriverWrapper
from .utils import make_realpath

class Wrapper(BaseWebdriverWrapper):
    def __init__(self, *args, **kwargs):
        super(Wrapper, self).__init__(*args, **kwargs)

        options = webdriver.FirefoxOptions()
        options.add_argument('-headless')

        capabilities = DesiredCapabilities.FIREFOX
        capabilities['marionette'] = True
        
        self._driver = webdriver.Firefox(options=options,
                                         capabilities=capabilities)
        self._setup_driver()

    def _setup_driver(self):
        print('Loading addon from "{}"'.format(self._packed_fpath))
        self._driver.install_addon(self._packed_fpath, temporary=True)
        print('Driver installed add-on')
