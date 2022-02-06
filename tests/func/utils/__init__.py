from os import path
from functools import reduce
import sys
import time

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

def make_realpath(pathlist):
    fpath = reduce(lambda p, p2: path.join(p, p2), pathlist, '')
    return path.realpath(fpath)


class RetriableError(Exception):
    def __init__(self, msg):
        super(RetriableError, self).__init__(msg)

def retry(retries=5, abort=True):
    def decorator(func):
        def wrapper(*args, **kwargs):
            count = 0
            while count < retries:
                try:
                    if count != 0:
                        time.sleep(1)

                    return func(*args, **kwargs)
                except RetriableError as e:
                    count += 1
                    print(str(e), file=sys.stderr)
                except TimeoutException as e:
                    count += 1
                    print(str(e), file=sys.stderr)

            # Assert if abort is set, when all retries are exhausted
            assert abort == False

        return wrapper
    return decorator


def check_predicate(errorType, msg):
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            predicate = kwargs.pop('predicate', None)
            ret = func(self, *args, **kwargs)
            if predicate and not predicate(self):
                raise errorType(msg)
            return ret
        return wrapper
    return decorator


def wait_for_next_page(driver, prev_url):
    wait = WebDriverWait(driver, 10)
    wait.until(lambda driver: (driver.current_url != prev_url
                               and driver.execute_script('return document.readyState') == 'complete'))
