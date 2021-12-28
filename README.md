[![CircleCI](https://circleci.com/gh/Joacchim/BookMyComics/tree/master.svg?style=svg&circle-token=4ff0f5dfce31b2fc7f2e8b6bc1418e13ab140fb5)](https://circleci.com/gh/Joacchim/BookMyComics/tree/master)

# BookMyComics
Firefox/Chrome add-on to keep track of your latest comics/manga/manhua/webtoon reads.

## Starting

In order to handle both Chrome and Firefox, we need to handle two different
`manifest.json` files. To do so, we created a little script to set it up called
`setup.py`. When starting just run as follow:

```bash
#
# To start working on Firefox:
#
> python3 setup.py firefox

#
# To start working on Chrome:
#
> python3 setup.py chrome
```

## Testing

The tests available in this repository are mostly functional tests, written in
python, and using selenium to control the browsers.

### Setup for testing

A few NodeJS dependencies are listed in the `package.json` file for testing
only (linting and packing the web-extension). Start by installing those on your
system using `npm` or `yarn`.

As the tests are written in python using selenium, please make sure that you
have installed beforehand:
 - python
 - the python dependencies (by using the `requirements.txt` file)

#### Specific case of Firefox

When using automated testing, `Firefox` requires a pre-packed extension, which
creates a few additional steps when testing new changes to the web-extension
(which are not required for other browsers):

```bash
# Pre-pack the extension
> ./node_modules/.bin/web-ext -s web-extension/ -a ./build build --override-dest
```

### Running the tests

They can be run using the pytest binary provided by the pip packages listed in
the requirements.txt file:
```bash
> pytest tests/func
```

It is **highly** recommended to use `-s -vvv` options when running tests to get useful information.

You can run tests from a specific file like this:

```bash
> pytest tests/func/test_reader.py
```

And you can run a specific function like this:

```bash
pytest tests/func/test_reader.py::TestUtilities::test_navigation
```

Additional parameters are available to limit which setup is to be tested:
 - `--browser`: Defines which browsers will be tested
   - Can be specified multiple times (one value at a time)
   - Accepts the values `chrome` and `firefox`
   - Default value includes all browsers
 - `--reader`: Defines which readers will be using for the tests
   - Can be specified multiple times (one value at a time)
   - Accepts the names of the supported readers (see the directory listing of
     `tests/func/utils/support/`)
   - Default value inclues all readers
