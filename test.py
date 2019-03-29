from __future__ import print_function

import os
from os import path

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait  # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC  # available since 2.26.0

# profile = webdriver.FirefoxProfile()
# profile.native_events_enabled = True

capabilities = DesiredCapabilities.FIREFOX
capabilities['marionette'] = True
# capabilities['binary'] = '/usr/bin/firefox'

# Create a new instance of the Firefox driver
# driver = webdriver.Firefox(profile, capabilities=capabilities)
driver = webdriver.Firefox(capabilities=capabilities)
print('Driver returned instance')

addon_path = path.realpath(path.join(os.getcwd(), './build/bmc.zip'))
print('Loading addon from "{}"'.format(addon_path))
driver.install_addon(addon_path, temporary=True)
print('Driver installed add-on')

# go to the google home page
print('Getting page...')
driver.get("http://www.google.com/ncr")

# the page is ajaxy so the title is originally this:
print("Initial page title: {}".format(driver.title))

# find the element that's name attribute is q (the google search box)
inputElement = driver.find_element_by_name("q")

# type in the search
inputElement.send_keys("cheese!")

# submit the form (although google automatically searches now without submitting)
inputElement.submit()

try:
    # we have to wait for the page to refresh, the last thing that seems to be updated is the title
    WebDriverWait(driver, 10).until(EC.title_contains("cheese!"))

    # You should see "cheese! - Google Search"
    print("Page title: {}".format(driver.title))

finally:
    driver.quit()

