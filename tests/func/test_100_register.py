import functools
import pytest


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
    @pytest.mark.skip(
        reason='#50|newly registered entry is not immediately displayed')
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
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register(name)
        registered_comic = reader_driver.get_comic_name()

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
        # And finally, check that this attempt failed, by verifying
        # that nothing was added:
        #

        registered = controller.sidebar.get_registered()
        assert len(registered) == orig_n_items
        # Ensure the hard-coded name is part of the list
        assert functools.reduce(
            lambda c, r: c+(r.get_name() == name),
            registered, 0) == 1
