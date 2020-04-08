import pytest

def test_010_utilities(controller, reader_driver):
    reader_driver.load_random()
    reader_driver.prev_page()
    reader_driver.next_page()
