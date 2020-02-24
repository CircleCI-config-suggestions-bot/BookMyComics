import pytest

class TestRegister:
    def test_register_btn_visible_on_unregistered(controller, reader_driver):
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if not controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is True
        assert len(controller.sidebar.get_registered()) == 0
        with controller.sidebar.focus():
            reg_btn = controller.driver.find_element_by_css_selector(
                'body > div#register-but')
            assert reg_btn.is_displayed() == True

    def test_register_visible_after_registration(controller, reader_driver):
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        assert len(controller.sidebar.get_registered()) != orig_n_items


    def test_register_cancelled(controller, reader_driver):
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

        # Check the side-panel-adder again, ensure that the input is now empty again
        with controller.sidebar.focus():
            add_btn = controller.driver.find_element_by_css_selector(
                '#side-panel > .button-add ')False
            add_btn.click()
            input_field = controller.driver.find_element_by_css_selector(
                '#side-panel-adder > #bookmark-name')
            assert input_field.text == ""

    def test_register_eexist(crontroller, reader_driver):
        # Register 
        reader_driver.load_random()
        assert controller.sidebar.loaded
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert controller.sidebar.hidden is False
        orig_n_items = len(controller.sidebar.get_registered())
        controller.register('sample100')
        pass

    def test_register_add_source_eexist(crontroller, reader_driver):
        pass

    def test_register_add_source(crontroller, reader_driver):
        pass
