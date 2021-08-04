from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import NoSuchElementException


class FrameFocus:
    def __init__(self, driver, frame):
        self._driver = driver
        self._frame = frame

    def __enter__(self):
        WebDriverWait(self._driver, 30).until(
            EC.frame_to_be_available_and_switch_to_it(self._frame))

    def __exit__(self, type, value, traceback):
        self._driver.switch_to.parent_frame()


class ItemSource:
    """
        Represents a registered Comic's source in the DOM.
        This class provide utilities to manipulate and check sources.
    """
    def __init__(self, sidepanel, dom_element):
        self._panel = sidepanel
        self._dom = dom_element

    def click(self):
        self._dom.find_element_by_css_selector('.label').click()

class RegisteredItem:
    """
        Represents and allows to control a registered manga/comic in the
        SidePanel
    """

    def __init__(self, sidepanel, dom_element):
        self._panel = sidepanel
        self._dom = dom_element

    def get_name(self):
        """ Returns the name displayed for the RegisteredItem """
        with self._panel.focus():
            name_label = self._dom.find_element_by_css_selector('.label-container > .label.rollingArrow')
            return name_label.text

    def list_sources(self):
        """ Returns a list of ItemSource for the RegisteredItem """
        if self.folded:
            self.toggle()
        items = self._dom.find_elements_by_css_selector('.nested > .label-container')
        return [ItemSource(self._panel, item) for item in items]

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
        fold_marker = self._dom.find_element_by_css_selector('.label-container > .label.rollingArrow')
        return "rollingArrow-down" not in fold_marker.get_attribute("class")

    def toggle(self):
        """
            Unrolls (unfold) or Rolls (fold) all the sources for the
            RegisteredItem, effectively showing/hiding them.
        """
        fold_marker = self._dom.find_element_by_css_selector('.label-container > .label.rollingArrow')
        fold_marker.click()


class SideBarController:
    SIDEPANEL_ID = 'BmcSidePanel'

    def __init__(self, driver):
        self._driver = driver
        def finder(driver):
            return driver.find_element(by=By.ID, value=self.SIDEPANEL_ID)
        WebDriverWait(self._driver, 10).until(finder)
        self._frame = finder(self._driver)

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
            WebDriverWait(self._driver, 10).until(
                lambda driver:
                driver.find_element(by=By.ID, value='side-panel'))
            mode_std = \
                self._driver.find_element(by=By.ID, value='side-panel')
            WebDriverWait(self._driver, 10).until(
                lambda driver:
                driver.find_element(by=By.ID, value='side-panel-adder'))
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
            txt = togbtn.text
            WebDriverWait(self._driver, 10).until(EC.element_to_be_clickable)
            togbtn.click()
            if txt == '>':
                WebDriverWait(self._driver, 10).until(
                    lambda driver:
                    driver.find_element(
                        by=By.ID, value='hide-but').text == '<')
            elif txt == '<':
                WebDriverWait(self._driver, 10).until(
                    lambda driver:
                    driver.find_element(
                        by=By.ID, value='hide-but').text == '>')

    def wait_for_text(self, expected_text, elem_id, timeout=10):
        with FrameFocus(self._driver, self._frame):
            wait = WebDriverWait(self._driver, timeout)
            wait.until(EC.text_to_be_present_in_element((By.ID, elem_id), expected_text))

    def start_registration_nofocus(self):
        """
            This function starts the registration process by clicking on the
            "+" button, and waiting to ensure that the SideBar is properly
            displayed with the right mode.

            Must be called within a FrameFocus's context.
        """
        add_btn = self._driver.find_element_by_css_selector(
            '#side-panel > .button-add ')
        add_btn.click()
        WebDriverWait(self._driver, 10).until(
            lambda driver: driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name').is_displayed())

    def register(self, display_name):
        """
            Allows to register the current page under the name `display_name`

            Note that at this moment, the function does not handle adding a new
            souce to an existing entry, and only attmepts to create a new
            entry.
        """
        with FrameFocus(self._driver, self._frame):
            self.start_registration_nofocus()
            input_field = self._driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            input_field.send_keys(display_name)
            cfrm_btn = self._driver.find_element_by_css_selector(
                '#side-panel-adder > #add-confirm.button-add')
            cfrm_btn.click()
            # Clicking on confirm button should temporarily disable the
            # confirm_button, which we expect to see acknowledgement of the
            # operation. Sadly, it may go faster than the test code can check,
            # so it's currently not relied-upon.

    def check_registration_error(self, do_wait=True):
        """
            Asserts whether the error display shows an error
        """
        with FrameFocus(self._driver, self._frame):
            disp = self._driver.find_element_by_css_selector(
                '#side-panel-adder > #error-display')
            if do_wait is False:
                assert disp.value_of_css_property('display') == 'none'
            else:
                def validator(driver):
                    elm = driver.find_element_by_css_selector(
                            '#side-panel-adder > #error-display')
                    return (elm.value_of_css_property('display') == 'block'
                            and elm.text != '')
                WebDriverWait(self._driver, 10).until(validator)

    def get_registered(self):
        """
            Returns a list of RegisteredItems from the current content of the
            SidePanel
        """
        with FrameFocus(self._driver, self._frame):
            items = []
            try:
                # Need to find something to wait on, which ensures that the
                # list is already populated by the web extension's JS
                def list_is_visible_and_loaded(driver):
                    elm = driver.find_element(by=By.ID, value='manga-list')
                    marker = driver.find_element(by=By.ID, value='manga-list-end-marker')
                    return elm and elm.value_of_css_property('display') == 'block' and marker
                WebDriverWait(self._driver, 10).until(list_is_visible_and_loaded)
                items = self._driver.find_elements_by_css_selector(
                    '#manga-list .mangaListItem')
            except NoSuchElementException:
                pass
        return [RegisteredItem(self, i) for i in items]

    def load(self, name):
        """
            Searches a registered entry matching `name`, and loads the
            associated comic by clicking on the element.
        """
        prev_url = self._driver.current_url
        with FrameFocus(self._driver, self._frame):
            # Need to find something to wait on, which ensures that the
            # list is already populated by the web extension's JS
            def list_is_visible_and_loaded(driver):
                elm = driver.find_element(by=By.ID, value='manga-list')
                marker = driver.find_element(by=By.ID, value='manga-list-end-marker')
                return elm and elm.value_of_css_property('display') == 'block' and marker
            WebDriverWait(self._driver, 10).until(list_is_visible_and_loaded)
            items = self._driver.find_elements_by_css_selector('#manga-list .mangaListItem')
            # Need to check text at relative xpath: '.label-container .label .inner_text'
            selected = [i for i in items if i.find_element_by_css_selector('.label-container .label').text == name]
            assert len(selected) == 1
            comic = RegisteredItem(self, selected[0])
            sources = comic.list_sources()
            assert len(sources) == 1
            sources[0].click()
        WebDriverWait(self._driver, 10).until(EC.url_changes(prev_url))


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

    def refresh(self):
        """
            Allows refreshing the Controller's internal state, to fit a
            new/refreshed page, and avoid stale WebElements
        """
        self._sidebar = None

    def reset(self):
        """
            Used by autouse fixtures

            This method forces a reset of the internal state of the controller,
            as well as the stored data, to ensure no overlap/conflict between
            functional tests.
        """
        self.refresh()
        with self.sidebar.focus():
            self._wrapped_driver.clear_storage()
        self.refresh()
