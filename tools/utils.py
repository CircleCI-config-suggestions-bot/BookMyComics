from os import listdir
from os.path import isfile, join


def get_all_js_files(path, filter_path=None):
    all_files = []

    for f in listdir(path):
        f_path = join(path, f)
        if filter_path is not None and f_path.endswith(filter_path):
            continue
        if isfile(f_path):
            if f_path.endswith('js'):
                all_files.append(f_path)
        else:
            all_files.extend(get_all_js_files(f_path))
    return all_files


def get_file_content(path):
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        print('get_file_content failed on "{}": {}'.format(path, e))
        return None
