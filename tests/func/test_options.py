import glob
import json
import os
from pathlib import Path
import pytest
import time


from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from .utils.drivers.chrome import Wrapper as ChromeDriverWrapper


@pytest.fixture(scope='session')
def importable_fpath():
    fpath = 'test_options_tracking_data.json'
    with open(fpath, 'w') as fh:
        fh.write(json.dumps(TestOptions.TRACKING_DATA))
        fh.close()
    yield f'{os.getcwd()}/{fpath}'
    os.unlink(fpath)


class TestOptions:
    # Payload to import/export, in order to avoid the requirement of setting up tracking data.
    TRACKING_DATA = [
        {
            "label": "LABEL1",
            "chapter": ["2"],
            "page": None,
            "_sources": [
                {
                    "name": "a2",
                    "reader": "localhost",
                    "info": {
                        "id": "a2",
                        "has_updates": True,
                    },
                },
                {
                    "name": "a1",
                    "reader": "localhost",
                    "info": {
                        "id": "a1",
                        "has_updates": True,
                    },
                },
            ],
        },
        {
            "label": "LABEL2",
            "chapter": ["3"],
            "page": None,
            "_sources": [
                {
                    "name": "a5",
                    "reader": "localhost",
                    "info": {
                        "id": "a5",
                        "has_updates": True,
                    },
                },
            ],
        },
        {
            "label": "LABEL3",
            "chapter": ["4"],
            "page": None,
            "_sources": [
                {
                    "name": "a4",
                    "reader": "localhost",
                    "info": {
                        "id": "a4",
                        "has_updates": False,
                    },
                },
            ],
        },
    ]

    @staticmethod
    def wait_for_download(trigger):
        #get file list before download
        files_before = glob.glob(
            # Assume we're running on unix-like system.
            f'{os.environ["HOME"]}/Downloads/bmc-data*.json'
        )

        start = time.time()
        elapsed = 0
        # write your code to click download
        trigger()
        #then loop till two mins to check whether there is any new file created
        latest = []
        while not latest and elapsed < 120:
            #get time and check if 120 second is elapsed
            done = time.time()
            elapsed = done - start
            # get new file list, and compute diff
            files_after = glob.glob(
                # Assume we're running on unix-like system.
                f'{os.environ["HOME"]}/Downloads/bmc-data*.json'
            )
            latest = list(set(files_after).difference(files_before))

        if not latest:
            raise RuntimeError('Expected "bmc-data.json" Download never completed ?!')

        return latest[0]

    @staticmethod
    def test_available(controller):
        if isinstance(controller.wrapped_driver, ChromeDriverWrapper):
            pytest.skip('Chomedriver tests not supported for Options page')
        controller.options.open()

    @staticmethod
    def do_import(controller, importable_fpath):
        input_field = controller.driver.find_element(by=By.ID, value='import-file')
        input_field.send_keys(importable_fpath)

        btn = controller.driver.find_element(by=By.ID, value='storage-import-submit')
        btn.click()

        controller.options.wait_notification('storage-import-form')

    @staticmethod
    def check_import(controller, unique_reader):
        # navigate to unique_reader's page, and check sidebar contents
        unique_reader.home()
        controller.refresh()
        if controller.sidebar.hidden:
            controller.sidebar.toggle()
        assert (
            len(controller.sidebar.get_registered()) == len(TestOptions.TRACKING_DATA)
        )

    @staticmethod
    def test_import(controller, unique_reader, importable_fpath):
        if isinstance(controller.wrapped_driver, ChromeDriverWrapper):
            pytest.skip('Chomedriver tests not supported for Options page')
        controller.options.open()

        TestOptions.do_import(controller, importable_fpath)
        TestOptions.check_import(controller, unique_reader)



    @staticmethod
    def test_export(controller, importable_fpath):
        if isinstance(controller.wrapped_driver, ChromeDriverWrapper):
            pytest.skip('Chomedriver tests not supported for Options page')
        controller.options.open()

        # Upload a specific payload first
        TestOptions.do_import(controller, importable_fpath)

        # Now, download it
        def trigger_download():
            btn = controller.driver.find_element(by=By.ID, value='storage-exporter')
            btn.click()
        fpath = TestOptions.wait_for_download(trigger_download)

        # Check the downloaded data
        with open(fpath, 'r') as fh:
            data = json.loads(fh.read())
        # Remove ids
        for e in data:
            del e['id']
        # Sort by labels, since they're supposed to be unique
        def keyf(entry):
            return entry['label']
        assert sorted(data, key=keyf) == sorted(TestOptions.TRACKING_DATA, key=keyf)


    @staticmethod
    def test_storage_reconf(controller, unique_reader, importable_fpath):
        if isinstance(controller.wrapped_driver, ChromeDriverWrapper):
            pytest.skip('Chomedriver tests not supported for Options page')

        # First, import data into the addon
        controller.options.open()
        TestOptions.do_import(controller, importable_fpath)
        TestOptions.check_import(controller, unique_reader)

        # Now, change storage config
        controller.options.open()
        selector = Select(
            controller.driver.find_element(by=By.ID, value='storage-selector')
        )
        selected = selector.first_selected_option.text
        # Prepare the acceptable options for this test (we expect both to be available)
        accepted = [s for s in ['LocalStorage', 'SyncStorage'] if s != selected]
        for idx, opt in enumerate(selector.options):
            if not opt.is_selected() and opt.text in accepted:
                opt.click()
                break
        btn = controller.driver.find_element(by=By.ID, value='storage-engine-submit')
        btn.click()
        controller.options.wait_notification('storage-engine-form')

        # Then, check data again
        TestOptions.check_import(controller, unique_reader)
