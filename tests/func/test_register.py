import functools
import pytest

from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


def load_another_random(controller, reader_driver, ignore_list):
    while True:
        reader_driver.load_random()
        if not controller.driver.current_url in ignore_list:
            break
    controller.refresh()

from .utils.bmc import init_sidebar
from .utils.support import drivers as reader_drivers


@pytest.mark.order(after='test_sidebar_display.py')
class TestRegister:

    @staticmethod
    def test_enter_key_bookmark_name_validation(controller, unique_reader):
        """
            Validates that pressing the "ENTER" key on the "bookmark-name"
            input is like clicking on the "confirm" button.
        """
        init_sidebar(unique_reader, controller)
        assert len(controller.sidebar.get_registered()) == 0
        with controller.sidebar.focus():
            controller.sidebar.start_registration_nofocus()
            bookmark_input = controller.driver.find_element_by_css_selector(
                '#bookmark-name')
            assert bookmark_input.is_displayed()
            bookmark_input.send_keys('what')
            bookmark_input.send_keys(Keys.RETURN)

            # Now we wait for the sidebar to be back.
            WebDriverWait(controller.driver, 10).until(
                    lambda driver:
                    driver.find_element_by_id('side-panel').is_displayed())

        assert len(controller.sidebar.get_registered()) != 0

    @staticmethod
    def test_escape_key_handling(controller, unique_reader):
        """
            Validates that pressing the "ESCAPE" key on the "adder menu"
            discards it.
        """
        init_sidebar(unique_reader, controller)
        assert len(controller.sidebar.get_registered()) == 0
        with controller.sidebar.focus():
            controller.sidebar.start_registration_nofocus()
            body = controller.driver.find_element_by_tag_name('body')
            body.send_keys(Keys.ESCAPE)

            sidepanel_adder = controller.driver.find_element_by_id(
                'side-panel-adder')
            assert not sidepanel_adder.is_displayed()

    @staticmethod
    def test_cancelled(controller, unique_reader):
        """
            Validates that cancelling a registration does not register any
            entry
        """
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())

        # Fake an attempt to register, end it with a cancel
        with controller.sidebar.focus():
            add_btn = controller.driver.find_element_by_css_selector(
                'body > div#register-but')
            add_btn.click()
            input_field = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            input_field.send_keys('to-be-cancelled')
            cancel_btn = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #add-cancel.button-add')
            cancel_btn.click()
        assert len(controller.sidebar.get_registered()) == orig_n_items

        # Check the side-panel-adder again, ensure that the input is now empty
        with controller.sidebar.focus():
            add_btn = controller.driver.find_element_by_css_selector(
                'body > div#register-but')
            add_btn.click()
            input_field = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            assert input_field.text == ""

    @staticmethod
    def test_eexist(controller, unique_reader):
        """
            Validates that attempting to register an existing comic name does
            not change the listing of registered comics
        """
        name = 'sample100-eexist'
        #
        # Setup: Register a random comic
        #
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register(name)
        registered_comic = unique_reader.get_comic_name()
        # Validate the initally registered comic
        registered = controller.sidebar.get_registered()
        assert len(registered) > orig_n_items
        orig_n_items = len(registered)
        # Ensure the hard-coded name is part of the list
        assert functools.reduce(
            lambda c, r: c+(r.name == name),
            registered, 0) == 1

        #
        # Now, attempt to register any other comic under the same name
        #
        # Some readers can not click on specific elements if we don't hide the
        # controller.sidebar before loading a random page
        if not controller.sidebar.hidden:
            controller.sidebar.toggle()

        unique_reader.load_random(
            predicate=lambda rd: rd.get_comic_name() != registered_comic)
        controller.refresh()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        controller.register(name, expect_failure=True)

        #
        # Confirm failure through multiple means:
        # - Error display message
        # - manga-list number of items is unchanged
        #
        controller.sidebar.check_registration_error(do_wait=True)
        # cancel registration to go back to the side-panels' manga-list
        with controller.sidebar.focus():
            cancel_btn = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #add-cancel.button-add')
            cancel_btn.click()
        registered = controller.sidebar.get_registered()
        # Check the number of manga-list items is unchanged
        assert len(registered) == orig_n_items
        # Ensure the hard-coded name is part of the list
        assert functools.reduce(
            lambda c, r: c+(r.name == name),
            registered, 0) == 1

    @staticmethod
    def test_manga_list_filter(controller, unique_reader):
        """
            Validates that the comic list is correctly filtered when the search
            input is used.
        """
        def check_filtered(controller, msg, nb_visible_expected):
            with controller.sidebar.focus():
                filter_input = controller.driver.find_element_by_css_selector(
                    '#side-panel > #searchbox')
                filter_input.clear()
                filter_input.send_keys(msg)

                items = controller.driver.find_elements_by_css_selector(
                    '#side-panel > #manga-list > .mangaListItem')
                nb_visible = 0
                for item in items:
                    if item.is_displayed():
                        nb_visible += 1
                assert nb_visible_expected == nb_visible

        init_sidebar(unique_reader, controller)
        to_ignore = []
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('totow')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        to_ignore.append(controller.driver.current_url)
        load_another_random(controller, unique_reader, to_ignore)

        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('zaza')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        to_ignore.append(controller.driver.current_url)
        load_another_random(controller, unique_reader, to_ignore)

        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('bobo')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        check_filtered(controller, 'o', 2)
        check_filtered(controller, 'a', 1)
        check_filtered(controller, 'x', 0)
        check_filtered(controller, 'tw', 1)

    @staticmethod
    def test_registration_name(controller, unique_reader):
        """
            Validates that the comic registration goes well, and that the new
            comic has its name in the sidebar and not the name of another
            comic.
        """
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        load_another_random(controller, unique_reader, [controller.driver.current_url])

        init_sidebar(unique_reader, controller, load_random=False)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample101')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        to_find = {'sample100', 'sample101'}
        counts = {}
        for comic in controller.sidebar.get_registered():
            counts[comic.name] = counts.get(comic.name, 0) + 1
        for expected_name in to_find:
            assert expected_name in counts.keys()
            assert counts[expected_name] == 1

    @staticmethod
    def test_toggle_click(controller, unique_reader):
        """
            Validates that when clicking on a comic, it only expand/collapse
            the given comic.
        """
        def check_active_subs(controller, nb):
            labels = controller.driver.find_elements_by_css_selector(
                '.label-container > .rollingArrow-down')
            assert len(labels) == nb
            sources = controller.driver.find_elements_by_css_selector(
                '.mangaListItem > .active')
            assert len(sources) == nb


        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('toto')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        load_another_random(controller, unique_reader, [controller.driver.current_url])
        init_sidebar(unique_reader, controller, load_random=False)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('zaza')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        with controller.sidebar.focus():
            comic = controller.driver.find_element_by_css_selector('.label-container')

            check_active_subs(controller, 0)
            comic.click()
            check_active_subs(controller, 1)
            comic.click()
            check_active_subs(controller, 0)

            comic = controller.driver.find_element_by_css_selector('.label-container > .label')

            comic.click()
            check_active_subs(controller, 1)
            comic.click()
            check_active_subs(controller, 0)

    @staticmethod
    def test_current_comic_source(controller, unique_reader):
        """
            Validates that once a comic is registered, both the comic entry
            itself and its source matching the current reader are set as
            "current" (which should highlight them)
        """
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        with controller.sidebar.focus():
            labels = controller.driver.find_elements_by_css_selector('.label-container.current')
            assert len(labels) == 2

        # We now check if it's correctly applied when reloading the page.
        controller.refresh()
        assert controller.sidebar.loaded
        with controller.sidebar.focus():
            labels = controller.driver.find_elements_by_css_selector('.label-container.current')
            assert len(labels) == 2

    @staticmethod
    def test_delete_from_entry_single_source(controller, unique_reader):
        """
            Validates that we can remove a Comic entry using the trash icon
            that appears when hovering over the comic's name in the sidebar.
        """
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        items = controller.sidebar.get_registered()
        assert len(items) != orig_n_items

        # Retrieve entry that we want to delete and delete it
        selected = [item for item in items if item.name == 'sample100']
        assert len(selected) == 1
        selected[0].delete()

        # Wait & check that we're back to (expected) 0 items in sidebar
        selected[0].wait_for_removal()
        controller.refresh()
        items = controller.sidebar.get_registered()
        assert len(items) == orig_n_items

    @staticmethod
    def test_delete_from_single_source(controller, unique_reader):
        """
            Validates that we can remove a Comic entry using the trash icon
            that appears when hovering over the comic's source's name in the
            sidebar.
        """
        init_sidebar(unique_reader, controller)
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        controller.refresh()
        items = controller.sidebar.get_registered()
        assert len(items) != orig_n_items

        # Retrieve entry that we want to delete and delete it
        selected = [item for item in items if item.name == 'sample100']
        assert len(selected) == 1
        assert len(selected[0].sources) == 1
        selected[0].sources[0].delete()

        # Wait & check that we're back to (expected) 0 items in sidebar
        selected[0].wait_for_removal()
        controller.refresh()
        items = controller.sidebar.get_registered()
        assert len(items) == orig_n_items
