import pytest

from selenium.webdriver.support.ui import WebDriverWait  # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC  # available since 2.26.0

from .utils.extension import Extension


EXT = Extension()

@pytest.mark.parametrize('reader_url', EXT.supported_readers)
def test_001_load(webdriver, reader_url):
    # Load the reader's URL
    webdriver.get(reader_url)
    # Ensure that the frame with ID 'BmcSidePanel' is loaded.
    # That's the marker that the extension was loaded properly
    inputElement = webdriver.find_element_by_id('BmcSidePanel')
    assert inputElement
