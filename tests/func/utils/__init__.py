from os import path
from functools import reduce
import sys
import time

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

            # Assert if abort is set, when all retries are exhausted
            assert abort == False

        return wrapper
    return decorator
