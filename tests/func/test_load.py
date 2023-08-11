import pytest

from .utils.extension import Extension

EXT = Extension()

TEST_URLS = EXT.supported_readers[:1] + [
    pytest.param('https://www.qwant.com/', marks=pytest.mark.xfail)
]


@pytest.mark.parametrize('reader_url', TEST_URLS)
def test_webext_loads(controller, test_website, reader_url):
    # Load the reader's URL
    controller.driver.get(reader_url)
    # Ensure that the frame with ID 'BmcSidePanel' is loaded.
    # That's the marker that the extension was loaded properly
    assert controller.sidebar.loaded
