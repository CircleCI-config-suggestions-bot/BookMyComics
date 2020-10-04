import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

from . import SupportBase
from .. import RetriableError, retry

class MangaKakalotDriver(SupportBase):
    name = "mangakakalot"

    def __init__(self, *args, **kwargs):
        super(MangaKakalotDriver, self).__init__(*args, **kwargs)

    def _get_mangas(self):
        # First, go to the website
        self._driver.get('https://mangakakalot.com/')
        # Retrieve the generated random link, which is generated after loading the page
        return self._driver.find_elements(by=By.CLASS_NAME, value='itemupdate')

    @retry(abort=True)
    def load_random(self, predicate=None):
        to_ignore = []

        mangas = self._get_mangas()
        while len(mangas) > 0:
            manga = mangas.pop(random.randrange(len(mangas)))
            chapters = manga.find_elements(by=By.CSS_SELECTOR, value='li>span>a')
            if len(chapters) < 3:
                continue
            href = chapters[1].get_attribute('href')
            if '://mangakakalot.com/' not in href or href in to_ignore:
                continue
            self._driver.get(href)
            # Validate predicate if specified
            if predicate and not predicate(self):
                to_ignore.append(href)
                mangas = self._get_mangas()
                continue
            return

        raise "No manga with enough chapters nor with link on mangakakalot"

    def prev_page(self):
        # In case you wonder, yes, button with "next" class is actually to go to the previous
        # chapter, because why not!
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.btn-navigation-chap>.next')
        btn.click()

    def next_page(self):
        # In case you wonder, yes, button with "back" class is actually to go to the next
        # chapter, because why not!
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.btn-navigation-chap>.back')
        btn.click()

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'mangakakalot.com' not in url:
            return None
        parts = self._driver.find_elements(by=By.CSS_SELECTOR, value=".breadcrumb > p > span > a > span")
        if len(parts) < 2:
            return None
        return parts[1].text
