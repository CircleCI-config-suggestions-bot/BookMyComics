import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from . import SupportBase
from .. import RetriableError, retry, check_predicate


class LocalhostDriver(SupportBase):
    name = 'localhost'

    def __init__(self, *args, **kwargs):
        super(LocalhostDriver, self).__init__(*args, **kwargs)

    def home(self):
        self._driver.get('http://localhost:5000/')

    @retry(abort=True)
    @check_predicate(RetriableError, "Could not load random comic")
    def load_random(self):
        self.home()
        mangas = self._driver.find_elements(
            by=By.CSS_SELECTOR,
            value='body>div#latest-updates>a')
        links = [elem.get_attribute('href') for elem in mangas]
        self._driver.get(links[random.randrange(len(links))])
        chapters = self._driver.find_elements(
            by=By.CSS_SELECTOR,
            value='body>div#chapters>a')
        links = [elem.get_attribute('href') for elem in chapters]
        self._driver.get(links[random.randrange(len(links))])
        pages = self._driver.find_elements(
            by=By.CSS_SELECTOR,
            value='body>div#buttons>button')
        # We might not be handling buttons with javascript=AJAX after all
        if not pages:
            pages = self._driver.find_elements(
                by=By.CSS_SELECTOR,
                value='body>div#buttons>a')[1:]
        if pages:
            # Since we might be handling either buttons (with javascript=AJAX)
            # or links, let's just click on them.
            elm = pages[random.randrange(len(pages))]
            elm.click()
            return

        # If we still did not get any page link ? Stick to chapters
        return

    def has_prev_page(self):
        prev_btns = self._driver.find_elements(
            by=By.CSS_SELECTOR, value='body>div#buttons>#prev'
        )
        prev_pg_btns = self._driver.find_elements(
            by=By.CSS_SELECTOR, value='body>div#buttons>#prev-page'
        )
        return prev_btns or prev_pg_btns

    def prev_page(self):
        try:
            btn = self._driver.find_element(
                by=By.CSS_SELECTOR, value='body>#buttons>#prev-page'
            )
        except NoSuchElementException:
            try:
                btn = self._driver.find_element(
                    by=By.CSS_SELECTOR, value='body>#buttons>#prev'
                )
            except Exception:
                print(f'Failed to get prev button for url {self._driver.current_url}')
        btn.click()

    def has_next_page(self):
        next_btns = self._driver.find_elements(
            by=By.CSS_SELECTOR, value='body>#buttons>#next'
        )
        next_pg_btns = self._driver.find_elements(
            by=By.CSS_SELECTOR, value='body>#buttons>#next-page'
        )
        return next_btns or next_pg_btns

    def next_page(self):
        try:
            btn = self._driver.find_element(
                by=By.CSS_SELECTOR, value='body>#buttons>#next-page'
            )
        except NoSuchElementException:
            try:
                btn = self._driver.find_element(
                    by=By.CSS_SELECTOR, value='body>#buttons>#next'
                )
            except Exception:
                print(f'Failed to get prev button for url {self._driver.current_url}')
        btn.click()

    def get_comic_name(self):
        parts = self._driver.current_url.split('/')
        return parts[3]

    def get_chapter(self):
        parts = self._driver.current_url.split('/')
        if len(parts) < 5:
            return None
        return parts[4]

    def get_page(self):
        parts = self._driver.current_url.split('/')
        if len(parts) < 6:
            return None
        return parts[5]
