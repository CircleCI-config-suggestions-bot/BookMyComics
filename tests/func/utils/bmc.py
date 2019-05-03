from selenium.webdriver.common.by import By


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
