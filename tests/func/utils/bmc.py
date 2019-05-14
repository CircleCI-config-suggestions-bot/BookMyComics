from selenium.webdriver.common.by import By


class FrameFocus:
    def __init__(self, driver, frame):
        self._driver = driver
        self._frame = frame

    def __enter__(self):
        self._driver.switch_to.frame(self._frame)

    def __exit__(self, type, value, traceback):
        self._driver.switch_to.default_content()


class SideBarController:
    SIDEPANEL_ID = 'BmcSidePanel'

    def __init__(self, driver):
        self._driver = driver
        self._frame = self._driver.find_element(
            by=By.ID, value=self.SIDEPANEL_ID)

    @property
    def loaded(self):
        """
            Checks if the frame with `id` SIDEPANEL_ID is loaded into
            the page. This one marker that the extension was properly
            loaded.
        """
        return not (self._frame is None)

    @property
    def size(self):
        """
            This function returns the current size of the sidepanel's frame.

            Returns a dict containing "height" and "width" keys
        """
        return self._frame.size

    @property
    def hidden(self):
        ret = False
        with FrameFocus(self._driver, self._frame):
            mode_std = \
                self._driver.find_element(by=By.ID, value='side-panel')
            mode_adder = \
                self._driver.find_element(by=By.ID, value='side-panel-adder')
            ret = not (mode_std.is_displayed() or mode_adder.is_displayed())
        return ret

    def toggle(self):
        with FrameFocus(self._driver, self._frame):
            togbtn = self._driver.find_element(by=By.ID, value='hide-but')
            togbtn.click()


class BmcController:

    def __init__(self, webdriver):
        self._driver = webdriver
        self._sidebar = None

    @property
    def driver(self):
        """
            Access the underlying webdriver directly.
            This is sometimes easier to go through this rather than wrap all
            calls to "hide"
        """
        return self._driver

    @property
    def sidebar(self):
        """
            Get the WebComponent corresponding to the SidePanel's iframe in the
            current window

            This is a lazy resolution, to ensure that we get the frame only
            when it's necessary (and supposed to be possible).
        """
        if not self._sidebar:
            self._sidebar = SideBarController(self._driver)
        return self._sidebar
