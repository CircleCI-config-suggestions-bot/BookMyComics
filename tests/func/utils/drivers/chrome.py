from selenium import webdriver
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

        self._driver = webdriver.Chrome(options=options,
                                        desired_capabilities=capabilities)
