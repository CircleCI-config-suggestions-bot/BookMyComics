import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

from . import SupportBase
from .. import RetriableError, retry, check_predicate

class MangaKakalotDriver(SupportBase):
    name = "mangakakalot"

    def __init__(self, *args, **kwargs):
        super(MangaKakalotDriver, self).__init__(*args, **kwargs)

    def _get_mangas(self):
        # First, go to the website
        self.home()
        # Retrieve the generated random link, which is generated after loading the page
        return self._driver.find_elements(by=By.CLASS_NAME, value='itemupdate')

    def validate_popup(self):
        # Bypass a common popup acting as a layer on top of the page...
        try:
            self._driver.find_element_by_css_selector(
                '#qc-cmp2-main .qc-cmp2-summary-buttons button:last-of-type').click()
        except NoSuchElementException:
            # fine, we only need to handle it once
            pass


    def home(self):
        """
            Loads the homepage of the reader
        """
        self._driver.get('https://mangakakalot.com/')
        self.validate_popup()

    @retry(abort=True)
    @check_predicate(RetriableError)
    def load_random(self):
        chapters_lists = [manga.find_elements(by=By.CSS_SELECTOR, value='li>span>a')
                          for manga in self._get_mangas()]

        def testable(cs):
            return len(cs) >= 3 and '.' not in cs[1].get_attribute('href').split('/')[-1]

        candidates = [chapters[1].get_attribute('href')
                      for chapters in chapters_lists if testable(chapters)]
        while len(candidates) > 0:
            candidate = candidates.pop(random.randrange(len(candidates)))
            if '://mangakakalot.com/' not in candidate:
                continue
            self._driver.get(candidate)
            return

        raise RuntimeError("No manga with enough chapters nor with link on mangakakalot")

    def has_prev_page(self):
        if self._driver.find_elements(by=By.CSS_SELECTOR, value='.btn-navigation-chap>.next'):
            return True
        return False

    def prev_page(self):
        self.validate_popup()
        # In case you wonder, yes, button with "next" class is actually to go to the previous
        # chapter, because why not!
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.btn-navigation-chap>.next')
        btn.click()

    def has_next_page(self):
        if self._driver.find_elements(by=By.CSS_SELECTOR, value='.btn-navigation-chap>.back'):
            return True
        return False

    def next_page(self):
        self.validate_popup()
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

    def get_chapter(self):
        """
            Returns the chapter number of the current loaded page.
        """
        parts = [p for p in self._driver.current_url.split('/') if p]
        return parts[-1].split('_')[-1]

    @staticmethod
    def get_page():
        """
            Returns the page number of the current loaded page.
            As MangaKakalot does not offer per-page browsing, we always return
            None
        """
        return None
