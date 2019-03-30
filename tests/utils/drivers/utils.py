from os import path
from functools import reduce

def make_realpath(pathlist):
    fpath = reduce(lambda p, p2: path.join(p, p2), pathlist, '')
    return path.realpath(fpath)
