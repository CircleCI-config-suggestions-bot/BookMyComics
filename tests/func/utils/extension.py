import json
import os
from os import path

from . import make_realpath


SRC_WEBEXT_PATH = './web-extensions/chrome'


class Extension:
    """
    This class represents an extension.

    It loads the properties of the extension from the manifest
    file, and computes the paths to both the unpacked and the
    packed version of the web extension.
    """

    def __init__(self):
        self._unpacked_path = make_realpath(
            [os.getcwd(), SRC_WEBEXT_PATH]
        )
        self._manifest_path = make_realpath(
            [self._unpacked_path, 'manifest.json']
        )
        # Load the extension's manifest data
        self._load()

        # Handle path computation to differentiate CI env
        # (with workspace data) and developer's environment
        # (build in source dir)
        bpath = os.environ.get('WEBEXT_DIR', None)
        if not bpath:
            bpath = path.join(os.getcwd(), 'build')
        self._packed_fpath = make_realpath([
            bpath,
            self.archive_name
        ])

    def _load(self):
        raw = ''
        with open(self._manifest_path, 'r') as f:
            raw = f.read()
        self._data = json.loads(raw)
        return self

    @property
    def name(self):
        return self._data['name'].lower()

    @property
    def version(self):
        return self._data['version']

    @property
    def archive_name(self):
        return '{}-{}.zip'.format(self.name, self.version)

    @property
    def unpacked_path(self):
        return self._unpacked_path

    @property
    def packed_path(self):
        return self._packed_fpath
