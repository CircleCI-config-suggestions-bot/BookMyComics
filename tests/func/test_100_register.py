import functools
import pytest
from selenium.webdriver.common.keys import Keys


class TestRegister:

    @staticmethod
    def test_btn_visible_on_unregistered(controller, reader_driver):
        """
            Validates that the 'register' button (a '+' symbol) is visible when
            the browsed comic is unregistered.
        """
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if not controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is True
        assert len(controller.sidebar.get_registered()) == 0
        with controller.sidebar.focus():
            reg_btn = controller.driver.find_element_by_css_selector(
                'body > div#register-but')
            assert reg_btn.is_displayed()

    @staticmethod
    def test_enter_key_bookmark_name_validation(controller, reader_driver):
        """
            Validates that pressing the "ENTER" key on the "bookmark-name"
            input is like clicking on the "confirm" button.
        """
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        assert len(controller.sidebar.get_registered()) == 0
        with controller.sidebar.focus():
            controller.sidebar.start_registration_nofocus()
            bookmark_input = controller.driver.find_element_by_css_selector(
                '#bookmark-name')
            assert bookmark_input.is_displayed()
            bookmark_input.send_keys('what')
            bookmark_input.send_keys(Keys.RETURN)
        assert len(controller.sidebar.get_registered()) != 0

    @staticmethod
    def test_registration(controller, reader_driver):
        """
            Validates that the comic registration goes well, and can be
            confirmed by the user: the new comic is visible in the SidePanel's
            MangaList immediately after registration
        """
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        assert len(controller.sidebar.get_registered()) != orig_n_items

    @staticmethod
    def test_cancelled(controller, reader_driver):
        """
            Validates that cancelling a registration does not register any
            entry
        """
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())

        # Fake an attempt to register, end it with a cancel
        with controller.sidebar.focus():
            add_btn = controller.driver.find_element_by_css_selector(
                '#side-panel > .button-add ')
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
                '#side-panel > .button-add ')
            add_btn.click()
            input_field = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            assert input_field.text == ""

    @staticmethod
    def test_eexist(controller, reader_driver):
        """
            Validates that attempting to register an existing comic name does
            not change the listing of registered comics
        """
        name = 'sample100-eexist'
        #
        # Setup: Register a random comic
        #
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register(name)
        registered_comic = reader_driver.get_comic_name()
        # Validate the initally registered comic
        registered = controller.sidebar.get_registered()
        assert len(registered) > orig_n_items
        orig_n_items = len(registered)
        # Ensure the hard-coded name is part of the list
        assert functools.reduce(
            lambda c, r: c+(r.get_name() == name),
            registered, 0) == 1

        #
        # Now, attempt to register any other comic under the same name
        #
        # Some readers can not click on specific elements if we don't hide the
        # controller.sidebar before loading a random page
        if not controller.sidebar.hidden:
            controller.sidebar.toggle()

        reader_driver.load_random(
            lambda rd: rd.get_comic_name() != registered_comic)
        controller.refresh()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        controller.register(name)

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
            lambda c, r: c+(r.get_name() == name),
            registered, 0) == 1

    @staticmethod
    def test_manga_list_filter(controller, reader_driver):
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

        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('totow')
        assert len(controller.sidebar.get_registered()) != orig_n_items
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('zaza')
        assert len(controller.sidebar.get_registered()) != orig_n_items
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('bobo')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        check_filtered(controller, 'o', 2)
        check_filtered(controller, 'a', 1)
        check_filtered(controller, 'x', 0)
        check_filtered(controller, 'tw', 1)

    @staticmethod
    def test_load(controller, reader_driver):
        """
            Validates that the registered comic can be properly loaded by
            clicking on the SidePanel's associated entry.
        """
        #
        # Do the registration first
        #
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100-load')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        #
        # With registration confirmed, Record URL/chapter/page
        # then back to home page
        #
        expected_url = controller.driver.current_url
        expected_name = reader_driver.get_comic_name()
        expected_chapter = reader_driver.get_chapter()
        expected_page = reader_driver.get_page()
        reader_driver.home()
        # Required, as consequence of going Home
        controller.refresh()

        #
        # Click on the SidePanel entry to load the comic, and check
        # url/chapter/page
        #
        controller.sidebar.load('sample100-load')
        assert controller.driver.current_url == expected_url
        assert reader_driver.get_comic_name() == expected_name
        assert reader_driver.get_chapter() == expected_chapter
        assert reader_driver.get_page() == expected_page

    @staticmethod
    def test_registration_name(controller, reader_driver):
        """
            Validates that the comic registration goes well, and that the new
            comic has its name in the sidebar and not the name of another
            comic.
        """
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        first_url = controller.driver.current_url
        while True:
            reader_driver.load_random()
            if first_url != controller.driver.current_url:
                break

        controller.refresh()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample101')
        assert len(controller.sidebar.get_registered()) != orig_n_items

        to_find = {'sample100', 'sample101'}
        counts = {}
        for comic in controller.sidebar.get_registered():
            counts[comic.get_name()] = counts.get(comic.get_name(), 0) + 1
        for expected_name in to_find:
            assert expected_name in counts.keys()
            assert counts[expected_name] == 1
