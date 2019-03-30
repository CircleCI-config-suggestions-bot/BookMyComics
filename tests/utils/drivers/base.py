import json
import os
from os import path

from .utils import make_realpath

class BaseWebdriverWrapper:
    def __init__(self, relative_src_path):
        self._unpacked_path = make_realpath([os.getcwd(), relative_src_path])
        self._manifest_path = make_realpath([self._unpacked_path, 'manifest.json'])

        # Handle path computation to differentiate CI env (with workspace data) and
        # developer's environment (build in source dir)
        bpath = os.environ.get('WEBEXT_DIR', None)
        if not bpath:
            bpath = path.join(os.getcwd(), 'build')
        self._packed_fpath = make_realpath([
            bpath,
            self._get_archive_name()
        ])

    def _get_archive_name(self):
        """
            Internal function, used to compute the packed webext path
        """
        data = ''
        with open(self._manifest_path, 'r') as f:
            data = f.read()
        manifest = json.loads(data)
        zipname = '{}-{}.zip'.format(manifest['name'].lower(), manifest['version'])
        return zipname

    @property
    def driver(self):
        """
            This property returns the configured webdriver instance
        """
        return self._driver

    def release(self):
        """
            This property releases (quits) the underlying webdriver
        """
        self.driver.quit()
