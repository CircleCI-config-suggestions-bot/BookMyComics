from .utils.extension import Extension
from selenium.webdriver.support.ui import WebDriverWait


EXT = Extension()
SIDEBAR_WIDTH = 206
COLLAPSED_SIDEBAR_HEIGHT = 58


def test_002_sidebar_default_hidden(controller):
    # Don't need to test them all, just select the first supported reader
    reader_url = EXT.supported_readers[0]

    controller.driver.get(reader_url)
    assert controller.sidebar.loaded

    # Ensures that the size is reduced to avoid overlapping on the page
    # -> This guarantees that the users can continue clicking on the page's
    # button when the sidebar is hidden.
    size = controller.sidebar.size
    assert size['height'] == COLLAPSED_SIDEBAR_HEIGHT and size['width'] == SIDEBAR_WIDTH

    # Ensures that the content of the sidebar is hidden
    assert controller.sidebar.hidden


def test_002_sidebar_displayed(controller):
    # Don't need to test them all, just select the first supported reader
    reader_url = EXT.supported_readers[0]

    controller.driver.get(reader_url)
    assert controller.sidebar.loaded

    if controller.sidebar.hidden:
        controller.sidebar.toggle()

    controller.sidebar.wait_for_text('<', 'hide-but')

    # Ensures that the size is expanded (as opposed to reduced when hidden)
    # Otherwise, the display won't be clearly visible for the user
    size = controller.sidebar.size
    assert size['height'] > COLLAPSED_SIDEBAR_HEIGHT and size['width'] == SIDEBAR_WIDTH

    # Ensures that the content of the sidebar is hidden
    assert not controller.sidebar.hidden


def test_002_sidebar_toggle(controller):
    # Don't need to test them all, just select the first supported reader
    reader_url = EXT.supported_readers[0]

    controller.driver.get(reader_url)
    assert controller.sidebar.loaded

    # Ensures that the content of the sidebar is toggled
    init_state = controller.sidebar.hidden
    controller.sidebar.toggle()
    assert init_state != controller.sidebar.hidden
    controller.sidebar.toggle()
    assert init_state == controller.sidebar.hidden
