class SupportBase:
    name = None

    def __init__(self, wrapped_driver, *args, **kwargs):
        self._wrapper = wrapped_driver
        self._driver = wrapped_driver.driver

    def home(self):
        pass

    def load_random(self):
        pass

    def has_prev_page(self):
        pass

    def prev_page(self):
        pass

    def has_next_page(self):
        pass

    def next_page(self):
        pass

    def get_comic_name(self):
        pass

    def get_page(self):
        pass

    def get_chapter(self):
        pass

from .mangafox import FanFoxDriver
from .mangakakalot import MangaKakalotDriver
from .manganato import MangaNatoDriver
from .isekaiscan import IsekaiScanDriver

drivers = {
    FanFoxDriver.name: FanFoxDriver,
    MangaKakalotDriver.name: MangaKakalotDriver,
    MangaNatoDriver.name: MangaNatoDriver,
    IsekaiScanDriver.name: IsekaiScanDriver,
}
