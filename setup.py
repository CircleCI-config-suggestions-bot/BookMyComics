import sys


def read_file(path):
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        print('Failed to read "{}": {}'.format(path, e))
        return None


def write_file(content, path):
    try:
        with open(path, 'w') as f:
            f.write(content)
            return 0
    except Exception as e:
        print('Failed to write into "{}"'.format(path))
        return 4


def switch_manifest(browser):
    content = read_file('browsers/{}.json'.format(browser))
    if content is None:
        print('aborting...')
        return 3
    return write_file(content, 'web-extension/manifest.json')


def show_options():
    print("Browser must be passed (either 'firefox' or 'chrome'). Example:")
    print("> python setup.py firefox")


def main():
    argv = sys.argv[1:]
    if len(argv) != 1:
        show_options()
        return 1
    if argv[0] == '-h' or argv[0] == '--help':
        show_options()
        return 0
    if argv[0] not in ["firefox", "chrome"]:
        print("Invalid browser passed")
        show_options()
        return 2
    return switch_manifest(argv[0])


if __name__ == "__main__":
    sys.exit(main())
