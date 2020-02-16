import pytest

from .utils.extension import Extension
from .utils.support import drivers

EXT = Extension()


def test_010_utilities(controller, reader_driver):
    reader_driver.load_random()
    reader_driver.prev_page()
    reader_driver.next_page()
