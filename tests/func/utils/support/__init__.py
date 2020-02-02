class SupportBase:
    name = None

    def __init__(self, driver, *args, **kwargs):
        self._driver = driver

    def load_random(self):
        pass

    def prev_page(self):
        pass

    def next_page(self):
        pass

drivers = {
}
