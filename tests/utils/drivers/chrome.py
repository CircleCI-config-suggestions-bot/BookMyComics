from selenium import webdriver

from .base import BaseWebdriverWrapper

class Wrapper(BaseWebdriverWrapper):

    def __init__(self, *args, **kwargs):
        super(Wrapper, self).__init__(*args, **kwargs)

        options = webdriver.ChromeOptions()
        options.add_argument('--load-extension={}'.format(self._unpacked_path))
        options.add_argument('--headless')

        self._driver = webdriver.Chrome(options=options)
