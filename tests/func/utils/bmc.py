from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import NoSuchElementException


class FrameFocus:
    def __init__(self, driver, frame):
        self._driver = driver
        self._frame = frame

    def __enter__(self):
        self._driver.switch_to.frame(self._frame)

    def __exit__(self, type, value, traceback):
        self._driver.switch_to.default_content()


class RegisteredItem:
    """
        Represents and allows to control a registered manga/comic in the
        SidePanel
    """

    def __init__(self, dom_element):
        self._dom = dom_element

    def get_name(self):
        """ Returns the name displayed for the RegisteredItem """
        name_label = self._dom.find_element_by_css_selector('.label-container > .label.rollingArrow')
        import pdb; pdb.set_trace()
        return name_label.text

    def list_sources(self):
        """ Returns a list of ItemSource for the RegisteredItem """
        pass

    def delete(self):
        """
            Deleted the RegisteredItem by triggering a click on the associated
            delete button
        """
        pass

    @property
    def folded(self):
        """
            Return a boolean telling whether the RegisteredItem's sources are
            unrolled of rolled-up
        """
        pass

    def unfold(self):
        """
            Unrolls (unfold) all the sources for the RegisteredItem, effectively
            showing them.
        """
        pass

    def fold(self):
        """
            Rolls-up (fold) all the sources for the RegisteredItem, effectively
            hiding them.
        """
        pass


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

    def focus(self):
        """
            Returns a FrameFocus object to be used as a ContextManager.

            This allows hiding the internal properties of the sidebar, while
            allowing to force the driver to focus on its frame, so that its
            contents can be inspected by the calling code.
        """
        return FrameFocus(self._driver, self._frame)

    def toggle(self):
        with FrameFocus(self._driver, self._frame):
            togbtn = self._driver.find_element(by=By.ID, value='hide-but')
            togbtn.click()

    def wait_for_text(self, expected_text, elem_id, timeout=10):
        with FrameFocus(self._driver, self._frame):
            wait = WebDriverWait(self._driver, timeout)
            wait.until(EC.text_to_be_present_in_element((By.ID, elem_id), expected_text))

    def register(self, display_name):
        """
            Allows to register the current page under the name `display_name`

            Note that at this moment, the function does not handle adding a new
            souce to an existing entry, and only attmepts to create a new
            entry.
        """
        with FrameFocus(self._driver, self._frame):
            add_btn = self._driver.find_element_by_css_selector(
                '#side-panel > .button-add ')
            add_btn.click()
            input_field = self._driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            input_field.send_keys(display_name)
            cfrm_btn = self._driver.find_element_by_css_selector(
                '#side-panel-adder > #add-confirm.button-add')
            cfrm_btn.click()

    def get_registered(self):
        """
            Returns a list of RegisteredItems from the current content of the
            SidePanel
        """
        with FrameFocus(self._driver, self._frame):
            items = []
            try:
                items = self._driver.find_elements_by_css_selector('#manga-list .mangaListItem')
            except NoSuchElementException:
                pass
        return [RegisteredItem(i) for i in items]


class BmcController:

    def __init__(self, wrapped_webdriver):
        self._wrapped_driver = wrapped_webdriver
        self._sidebar = None

    @property
    def driver(self):
        """
            Access the underlying webdriver directly.
            This is sometimes easier to go through this rather than wrap all
            calls to "hide"
        """
        return self.wrapped_driver.driver

    @property
    def wrapped_driver(self):
        """
            Access the wrapped webdriver.
            This enables possible use of common utility methods from the
            wrapper.
        """
        return self._wrapped_driver

    @property
    def sidebar(self):
        """
            Get the WebComponent corresponding to the SidePanel's iframe in the
            current window

            This is a lazy resolution, to ensure that we get the frame only
            when it's necessary (and supposed to be possible).
        """
        if not self._sidebar:
            self._sidebar = SideBarController(self.driver)
        return self._sidebar

    def register(self, display_name):
        """
            Register the current manga/comic page as a new entry in the
            extension.
        """
        self.sidebar.register(display_name)

    def reset(self):
        """
            Used by autouse fixtures

            This method forces a reset of the internal state of the controller,
            as well as the stored data, to ensure no overlap/conflict between
            functional tests.
        """
        with self.sidebar.focus():
            self._wrapped_driver.clear_storage()
