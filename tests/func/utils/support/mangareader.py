import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from . import SupportBase
from .. import RetriableError, retry

class MangaReaderDriver(SupportBase):
    name = "mangareader"

    def __init__(self, *args, **kwargs):
        super(MangaReaderDriver, self).__init__(*args, **kwargs)

    @retry(abort=True)
    def load_random(self):
        # First, go to the website
        self._driver.get('https://www.mangareader.net')

        # Then Use the "Surprise Me!" button to randomly choose a manga
        btn = self._driver.find_element(by=By.PARTIAL_LINK_TEXT, value='Surprise')
        btn.click()

        # Now, retrieve all chapters links and choose one
        chapters = self._driver.find_elements_by_css_selector(
            'table#listing > tbody > tr > td > a')
        if not chapters:
            raise RetriableError("No chapter found for random manga")
        link = chapters[random.randrange(len(chapters))].get_attribute('href')
        # Need to use the link here, as the click on the element did not work
        # in the timing the script generated.
        self._driver.get(link)

        # Finally, retrieve the page selector to choose a random one, ensuring
        # that we select neither the first nor the last.
        page_selector = self._driver.find_element(by=By.ID, value='pageMenu')
        if not page_selector:
            raise RetriableError("No page selector found")
        options = page_selector.get_property('options')
        if not options:
            raise RetriableError("No options found in the page selector")
        if len(options) <= 2:
            # This might mean that we're looking at one-page chapters for the
            # manga. As the reader supports it, let's go with this.
            return
        options[random.randrange(1, len(options) -1)].click()

    def prev_page(self):
        span = self._driver.find_element(by=By.CLASS_NAME, value='prev')
        btn = span.find_element(by=By.TAG_NAME, value='a')
        btn.click()

    def next_page(self):
        span = self._driver.find_element(by=By.CLASS_NAME, value='next')
        btn = span.find_element(by=By.TAG_NAME, value='a')
        btn.click()
