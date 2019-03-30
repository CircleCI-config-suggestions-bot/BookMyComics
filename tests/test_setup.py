from __future__ import print_function

import os
from os import path

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait  # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC  # available since 2.26.0


def test_setup(webdriver):
    # go to the google home page
    print('Getting page...')
    webdriver.get("http://www.google.com/ncr")
    # the page is ajaxy so the title is originally this:
    print("Initial page title: {}".format(webdriver.title))
    # find the element that's name attribute is q (the google search box)
    inputElement = webdriver.find_element_by_name("q")
    # type in the search
    inputElement.send_keys("cheese!")
    # submit the form (although google automatically searches now without submitting)
    inputElement.submit()

    # we have to wait for the page to refresh, the last thing that seems to be updated is the title
    WebDriverWait(webdriver, 10).until(EC.title_contains("cheese!"))
    # You should see "cheese! - Google Search"
    assert "cheese! - Google Search" == webdriver.title
