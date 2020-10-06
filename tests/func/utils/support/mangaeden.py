import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

from . import SupportBase
from .. import RetriableError, retry

class MangaEdenDriver(SupportBase):
    name = "mangaeden"

    def __init__(self, *args, **kwargs):
        super(MangaEdenDriver, self).__init__(*args, **kwargs)

    @retry(abort=True, retries=10)
    def load_random(self, predicate=None):
        # First, go to the website
        self._driver.get('https://www.mangaeden.com/')

        # Retrieve the generated random link, which is generated after loading the page
        btn = self._driver.find_element(by=By.CLASS_NAME, value='randomize')
        href = btn.get_attribute('href')
        self._driver.get(href)

        # Validate predicate if specified
        if predicate and not predicate(self):
            raise RetriableError("Selected Comic does not fit predicate requirements")

        # Now select randomly a chapter in the list of chapters
        chapters = self._driver.find_elements(by=By.CLASS_NAME, value='chapterLink')
        if chapters is None or len(chapters) < 1:
            raise RetriableError('No chapter link found in manga summary.')
        chapters[random.randrange(len(chapters))].click()
        # In some cases, the manga chapters redirect to authentication page. check for it
        if self._driver.current_url == 'https://www.mangaeden.com/en/login':
            raise RetriableError('Manga chapter redirected to login page. Cannot work with it.')

        # Now, select a page which has both "next" and "prev" pages
        # (ie: neither first nor last)
        try:
            page_selector = self._driver.find_element(by=By.ID, value='pageSelect')
        except NoSuchElementException:
            raise RetriableError('No page selector found in manga chapter')
        pages = page_selector.find_elements(by=By.TAG_NAME, value='option')
        if len(pages) <= 2:
            # This might mean that we're looking at one-page chapters for the
            # manga. As the reader supports it, let's go with this.
            return
        page_selector.click()
        pages[random.randrange(1, len(pages) - 1)].click()

    def prev_page(self):
        btn = self._driver.find_element(by=By.CLASS_NAME, value='prev')
        btn.click()

    def next_page(self):
        btn = self._driver.find_element(by=By.CLASS_NAME, value='next')
        btn.click()

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'mangaeden.com' not in url:
            return None
        return url.split('/')[5]
