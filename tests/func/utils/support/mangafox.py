import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from . import SupportBase
from .. import RetriableError, retry


class FanFoxNavBar:
    def __init__(self, driver_wrapper):
        self._wrapper = driver_wrapper
        self._driver = driver_wrapper.driver
        self._pages = None
        self._pageIdx = -1
        self._chapter_prev = None
        self._chapter_next = None
        self.update()

    def update(self):
        # pages = self._driver.find_elements_by_css_selector('div.pager-list-left > span > a')
        # chapters = self._driver.find_elements_by_css_selector('div.pager-list-left > a.chapter')
        pager = self._get_pager()
        if not pager:
            return False

        self._pages = pager.find_elements_by_css_selector('span > a')
        chapters = pager.find_elements_by_css_selector('a.chapter')
        self._chapter_prev = None
        self._chapter_next = None
        for button in chapters:
            if "Pre" in button.text:
                self._chapter_prev = button
            if "Next" in button.text:
                self._chapter_next = button

        self._pageIdx = self._get_current_page_idx()
        return True

    def _get_pager(self):
        pagers = self._driver.find_elements(by=By.CLASS_NAME, value='pager-list-left')
        for i in range(len(pagers)):
            if pagers[i].get_property('childElementCount') > 0:
                pager = pagers[i]
                return pager
        return None

    def _get_current_page_idx(self):
        curPageIdx = -1
        for i in range(len(self._pages)):
            if 'active' in self._pages[i].get_attribute('class'):
                curPageIdx = i
                break
        return curPageIdx

    def prev_chapter(self):
        if not self._chapter_prev:
            return False
        self._wrapper.ensure_click(self._chapter_prev)
        return self.update()

    def first_page(self):
        if not self._pages or self._pageIdx == 0:
            return False
        self._wrapper.ensure_click(self._pages[1])
        return self.update()

    def prev_page(self):
        if not self._pages or self._pageIdx <= 0:
            return False
        self._wrapper.ensure_click(self._pages[0]) # Click on the "<" button
        return self.update()

    def next_page(self):
        if not self._pages or self._pageIdx == (len(self._pages) - 1):
            return False
        self._wrapper.ensure_click(self._pages[len(self._pages) -1 ]) # Click on the ">" button
        return self.update()

    def last_page(self):
        if not self._pages or self._pageIdx == (len(self._pages) - 1):
            return False
        self._wrapper.ensure_click(self._pages[len(self._pages) - 2])
        return self.update()

    def next_chapter(self):
        if not self._chapter_next:
            return False
        self._wrapper.ensure_click(self._chapter_next)
        return self.update()


class FanFoxDriver(SupportBase):
    name = "mangafox"

    def __init__(self, *args, **kwargs):
        super(FanFoxDriver, self).__init__(*args, **kwargs)
        self._navbar = FanFoxNavBar(self._wrapper)

    def home(self):
        """
            Loads the homepage of the reader
        """
        self._driver.get('https://fanfox.net')

    @retry(abort=True)
    def load_random(self, predicate=None):
        # First, go to the website
        self.home()

        # Then randomly choose one of the "latest" chapters from the home page
        latest_chapters = self._driver.find_elements_by_css_selector(
            'p.manga-list-1-item-subtitle > a')
        self._driver.get(
            latest_chapters[random.randrange(len(latest_chapters))]
            .get_attribute('href'))
        if self._driver.current_url == 'https://fanfox.net':
            raise RetriableError('Could not load a random "latest" chapter')

        # Validate predicate if specified
        if predicate and not predicate(self):
            raise RetriableError("Selected Comic does not fit predicate requirements")

        # Now, select a page which has both "next" and "prev" pages (ie:
        # neither first nor last), but first we need to ensure the DOM has been
        # properly updated, and that the required select is present (it's added
        # dynamically)
        try:
            pages = self._driver.find_elements_by_css_selector('div > div > span > a')
        except NoSuchElementException:
            raise RetriableError('No pages buttons found in manga chapter')
        if len(pages) <= 2:
            # This might mean that we're looking at one-page chapters for the
            # manga. As the reader supports it, let's go with this.
            self._navbar.update()
            return
        # Only retain half the links (the navigation buttons are present twice
        # in a page, on top of the scan and underneath it).
        pages = pages[0:int(len(pages)/2)]
        self._wrapper.ensure_click(pages[random.randrange(1, len(pages) - 1)])
        self._navbar.update()

    def prev_page(self):
        if not self._navbar.prev_page():
            if self._navbar.prev_chapter():
                if not self._navbar.last_page():
                    print('Already at earliest page, cannot go to previous')
                    return

    def next_page(self):
        if not self._navbar.next_page():
            if not self._navbar.next_chapter():
                print('Already at latest chapter, cannot go to next')
                return

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'fanfox.net' not in url:
            return None
        return url.split('/')[4]

    def get_chapter(self):
        """
            Returns the chapter number of the current loaded page.
        """
        parts = [p for p in self._driver.current_url.split('/') if p]
        return int(parts[2].replace('c', ''))

    def get_page(self):
        """
            Returns the page number of the current loaded page.
        """
        parts = [p for p in self._driver.current_url.split('/') if p]
        return int(parts[3].replace('.html', ''))
