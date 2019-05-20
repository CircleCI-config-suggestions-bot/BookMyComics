from os import listdir
from os.path import isfile, join
import sys

STRINGS_PATH = 'web-extensions/chrome/strings.js'


def get_file_content(path):
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        print('get_file_content failed on "{}": {}'.format(path, e))
        return None


def check_error_codes(file_path, error_codes, string_codes, errors):
    content = get_file_content(file_path)
    if content is None:
        return
    for index, line in enumerate(content.splitlines()):
        line = line.strip()
        start_log = 'LOGS.' in line
        start_loc = 'LOCALIZATION.' in line
        if start_loc or start_log:
            line = line.split('LOGS.')[1] if start_log else line.split('LOCALIZATION.')[1]
            code = line.split("'")[1].split("'")[0]
            if code.startswith('E'):
                if code not in error_codes:
                    errors.append('[{}:{}]: Unknown error code "{}"'.format(file_path, index + 1,
                                                                            code))
                else:
                    error_codes[code]['usage'] += 1
                    if error_codes[code]['string'] not in string_codes:
                        errors.append('[{}:{}]: Unknown string code "{}" used in error code "{}"'
                                      .format(file_path, index + 1, error_codes[code]['string'],
                                              code))
                    else:
                        string_codes[error_codes[code]['string']]['usage'] += 1
            elif code.startswith('S'):
                if code not in string_codes:
                    errors.append('[{}:{}]: Unknown string code "{}"'.format(file_path, index + 1,
                                                                             code))
                else:
                    string_codes[code]['usage'] += 1


def get_all_js_files(path):
    all_files = []

    for f in listdir(path):
        f_path = join(path, f)
        if f_path.endswith(STRINGS_PATH):
            continue
        if isfile(f_path):
            if f_path.endswith('js'):
                all_files.append(f_path)
        else:
            all_files.extend(get_all_js_files(f_path))
    return all_files


def get_all_defined_strings_and_error_codes(errors):
    error_codes = {}
    string_codes = {}
    is_in_errors = False
    is_reading_errors = False
    is_in_logs = False
    is_reading_logs = False

    content = get_file_content(STRINGS_PATH)
    if content is None:
        return error_codes, string_codes
    for index, line in enumerate(content.splitlines()):
        line = line.strip()
        if is_reading_errors is True:
            if line.startswith("//"):
                continue
            if not line.startswith("'E"):
                is_reading_errors = False
                is_in_errors = False
                continue
            error_code = line.split("'")[1].split("'")[0]
            string_code = line.split(":")[1].split("'")[1].split("'")[0]
            if error_code in error_codes:
                errors.append("[{}:{}]: error code '{}' is duplicated with line {}"
                              .format(STRINGS_PATH, index + 1, error_code,
                                      error_codes[error_code]['line']))
                continue
            error_codes[error_code] = {'line': index + 1, 'string': string_code, 'usage': 0}
        elif is_in_errors is True:
            is_reading_errors = line.startswith('this.ERRORS = {')
        elif line.startswith('function Logs('):
            is_in_logs = False
            is_in_errors = True
        elif is_reading_logs:
            if line.startswith("//"):
                continue
            if line.startswith('};'):
                is_reading_logs = False
                is_in_logs = False
                continue
            if not line.startswith("'S"):
                continue
            string_code = line.split("'")[1].split("'")[0]
            if string_code in string_codes:
                errors.append("[{}:{}]: string code '{}' is duplicated with line {}"
                              .format(STRINGS_PATH, index + 1, string_code,
                                      string_codes[string_code]['line']))
                continue
            string_codes[string_code] = {'line': index + 1, 'usage': 0}
        elif is_in_logs is True:
            is_reading_logs = line.startswith('this.STRINGS = {')
        elif line.startswith('function Localization('):
            is_in_logs = True
            is_in_errors = False

    return error_codes, string_codes


def check_usage(codes, kind, errors):
    for key in codes:
        if codes[key]['usage'] == 0:
            errors.append('Unused {}: "{}" from [{}:{}]'.format(kind, key, STRINGS_PATH,
                                                                codes[key]['line']))


def main_func():
    errors = []
    print("=> Getting error codes and string codes...")
    error_codes, string_codes = get_all_defined_strings_and_error_codes(errors)
    print("<= Done")
    print("Found {} error codes".format(len(error_codes)))
    print("Found {} string codes".format(len(string_codes)))
    print("=> Getting all js files...")
    all_js_files = get_all_js_files('web-extensions')
    print("<= Done")
    print("Found {} js files".format(len(all_js_files)))
    print("=> Checking all js files...")
    for js_file in all_js_files:
        print("==> Checking '{}'...".format(js_file))
        check_error_codes(js_file, error_codes, string_codes, errors)
    print("<= Done")
    check_usage(string_codes, 'string code', errors)
    check_usage(error_codes, 'error code', errors)
    if len(errors) > 0:
        print("=== ERRORS ===")
        for error in errors:
            print("=> {}".format(error))
    else:
        print("==> NO ERROR FOUND")
    return len(errors)


if __name__ == "__main__":
    sys.exit(main_func())
