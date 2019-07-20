import sys
from utils import get_all_js_files, get_file_content

FUNCTIONS_TO_NOT_CALL = {
    'Array.prototype.slice.call': {
        'to_ignore': ['web-extensions/chrome/utils.js'],
        'replacement': 'arrayClone',
    },
}


def check_file(path, errors):
    functions = []
    for key in FUNCTIONS_TO_NOT_CALL:
        files_to_ignore = FUNCTIONS_TO_NOT_CALL[key]['to_ignore']
        for f in files_to_ignore:
            if not path.endswith(f):
                functions.append(['{}('.format(key), key, FUNCTIONS_TO_NOT_CALL[key]['replacement']])
    if len(functions) == 0:
        print('Ignoring file "{}": nothing to check in there!'.format(path))
    content = get_file_content(path)
    if content is None:
        return
    for index, line in enumerate(content.splitlines()):
        line = line.strip()
        if line.startswith('//'):
            continue
        for function in functions:
            if function[0] in line:
                errors.append('[{}:{}]: "{}" should be replaced with "{}"'.format(path, index + 1,
                                                                                  function[1],
                                                                                  function[2]))


def main_func():
    errors = []
    print("=> Getting all js files...")
    all_js_files = get_all_js_files('web-extensions')
    print("<= Done")
    print("Found {} js files".format(len(all_js_files)))
    print("=> Checking all js files...")
    for js_file in all_js_files:
        print("==> Checking '{}'...".format(js_file))
        check_file(js_file, errors)
    print("<= Done")
    if len(errors) > 0:
        print("=== ERRORS ===")
        for error in errors:
            print("=> {}".format(error))
    else:
        print("=== NO ERROR FOUND ===")
    return len(errors)


if __name__ == "__main__":
    sys.exit(main_func())
