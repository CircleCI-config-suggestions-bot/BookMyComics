import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

from . import SupportBase
from .. import RetriableError, retry

class IsekaiScanDriver(SupportBase):
    name = "isekaiscan"

    def __init__(self, *args, **kwargs):
        super(IsekaiScanDriver, self).__init__(*args, **kwargs)

    def _get_mangas(self):
        # First, go to the website
        self._driver.get('https://isekaiscan.com/')
        # Retrieve the generated random link, which is generated after loading the page
        return self._driver.find_elements(by=By.CSS_SELECTOR, value='.chapter-item')

    @retry(abort=True)
    def load_random(self, predicate=None):
        to_ignore = []

        mangas = self._get_mangas()
        while len(mangas) > 0:
            manga = mangas.pop(random.randrange(len(mangas)))
            chapters = manga.find_elements(by=By.CSS_SELECTOR, value='.chapter>a')
            if len(chapters) < 2:
                continue
            href = chapters[1].get_attribute('href')
            self._driver.get(href)
            return

        raise "No manga with enough chapters nor with link on isekaiscan"

    def prev_page(self):
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.nav-previous>.prev_page')
        btn.click()

    def next_page(self):
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.nav-next>.next_page')
        btn.click()

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'isekaiscan.com' not in url:
            return None
        parts = self._driver.find_elements(by=By.CSS_SELECTOR, value="#manga-reading-nav-head .breadcrumb li:nth-child(1) > a")
        return parts[0].text
