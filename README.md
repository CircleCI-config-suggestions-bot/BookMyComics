[![CircleCI](https://circleci.com/gh/Joacchim/BookMyComics/tree/master.svg?style=svg&circle-token=4ff0f5dfce31b2fc7f2e8b6bc1418e13ab140fb5)](https://circleci.com/gh/Joacchim/BookMyComics/tree/master)

# BookMyComics
Firefox/Chrome add-on to keep track of your latest comics/manga/manhua/webtoon reads.

## Starting

In order to handle both Chrome and Firefox, we need to handle two different `manifest.json` files. To do so, we created a little script to set it up called `setup.py`. When starting just run as follow:

```bash
# To start working on Firefox:
> python3 setup.py firefox
# To start working on Chrome:
> python3 setup.py chrome
```
