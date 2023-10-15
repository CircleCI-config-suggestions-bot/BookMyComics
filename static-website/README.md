This web-server is used to test the features of the web-extension and only that.

You need to install the python `flask` package (using `pip` for example).

You can run it like this:

```console
FLASK_APP=server flask run
```

## Explanations for browsing

The number for both `page` and `chapter` must be between 1 and 4 included. The URL looks like this for the "chapter view":

```
/<manga>/<chapter>
```

And it looks like this for the "page view":

```
/<manga>/<chapter>/<page>
```

`<manga>` can be anything you want, only `chapter` and `page` have restrictions.

Of course, you can simply browse the website by starting at its index page, `/`.

On chapter and page views, you can enable ajax (instead of links) by adding `?ajax=1` at the end of the URL. For example:

```
# The "normal" chapter view:
/manga/1
# The ajax chapter view:
/manga/1?ajax=true

# The "normal" page view:
/manga/1/1
# The ajax page view:
/manga/1/1?ajax=1
```
