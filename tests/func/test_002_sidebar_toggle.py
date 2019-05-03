from .utils.extension import Extension


EXT = Extension()


def test_002_sidebar_default_hidden(controller):
    # Don't need to test them all, just select the first supported reader
    reader_url = EXT.supported_readers[0]

    controller.driver.get(reader_url)
    assert controller.sidebar.loaded

    # Ensures that the size is reduced to avoid overlapping on the page
    # -> This guarantees that the users can continue clicking on the page's
    # button when the sidebar is hidden.
    size = controller.sidebar.size
    assert size['height'] == 58.0 and size['width'] == 200.0

    # Ensures that the content of the sidebar is hidden
    assert controller.sidebar.hidden

