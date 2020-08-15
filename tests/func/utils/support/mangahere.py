import random

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from . import SupportBase
from .. import RetriableError, retry, wait_for_next_page


class MangaHereDriver(SupportBase):
    name =  "mangahere"

    def __init__(self, *args, **kwargs):
        super(MangaHereDriver, self).__init__(*args, **kwargs)

    def _get_chapter_url(self):
        return self._driver.current_url.split('?')[0]

    def _get_link_btn(self, match):
        btns = self._driver.find_elements_by_css_selector(".loadImgPage.pull-right")
        for btn in btns:
            if match == btn.text:
                return btn
        return None

    @retry(abort=True)
    def load_random(self, predicate=None):
        base_url = 'http://mangahere.us'
        # First, go to the website
        self._driver.get(base_url + "/home")
        # Then randomly choose one of the "latest" chapters from the home page
        latest_chapters = self._driver.find_elements(by=By.CLASS_NAME, value='xanh')
        if not latest_chapters:
            raise RetriableError("No latest chapter found")

        # Check that the link is within the current website since this reader
        # is known to redirect us toward another once in a while
        while len(latest_chapters):
            chapter = latest_chapters.pop(random.randrange(len(latest_chapters)))
            if base_url in chapter.get_attribute('href'):
                break
            if not len(latest_chapters):
                assert not "No 'latest' chapter redirects to the same website. Cannot test."

        prev_url = self._driver.current_url
        self._driver.execute_script('arguments[0].click()', chapter)

        # Ensure we properly wait for the page to load
        try:
            wait_for_next_page(self._drive, prev_url)
            selector = self._driver.find_element(by=By.ID, value='page_select')
        except NoSuchElementException:
            raise RetriableError('No page selector found in manga chapter')
        # Ensure we've indeed loaded a new page
        if self._driver.current_url == (base_url + "/home"):
            raise RetriableError('Could not load a random "latest" chapter')

        # Validate predicate if specified
        if predicate and not predicate(self):
            raise RetriableError("Selected Comic does not fit predicate requirements")

        # Now, select a page which has both "next" and "prev" pages (ie:
        # neither first nor last), but first we need to ensure the DOM has been
        # properly updated, and that the required select is present (it's added
        # dynamically)
        try:
            wait = WebDriverWait(self._driver, 10)
            wait.until(EC.presence_of_element_located((By.ID, 'page_select')))
            selector = self._driver.find_element(by=By.ID, value='page_select')
        except NoSuchElementException:
            raise RetriableError('No page selector found in manga chapter')
        except TimeoutException:
            raise RetriableError('Timed-out while waiting for the page selector')
        options = selector.find_elements_by_tag_name('option')
        if len(options) <= 2:
            # This might mean that we're looking at one-page chapters for the
            # manga. As the reader supports it, let's go with this.
            return
        options[random.randrange(1, len(options) - 1)].click()

    def prev_page(self):
        btn = self._get_link_btn('Prev')
        if btn:
            self._wrapper.ensure_click(btn)
            return
        # If no prev btn, expect to navigate to previous chapter (then last
        # page?)
        if not btn:
            btn = self._driver.find_element(by=By.CLASS_NAME, value='LeftArrow')
            self._wrapper.ensure_click(btn)
            selector = self._driver.find_element(by=By.ID, value='page_select')
            options = selector.find_elements_by_tag_name('option')
            selector.select_by_index(len(options) - 1)

    def next_page(self):
        btn = self._get_link_btn('Next')
        # If no next btn, expect to navigate to next chapter
        if not btn:
            btn = self._driver.find_element(by=By.CLASS_NAME, value='RightArrow')
        if btn:
            self._wrapper.ensure_click(btn)

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'mangahere.us' not in url:
            return None
        return '-'.join(url.split('/')[3].split('-')[:-2])
