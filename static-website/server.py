import flask


app = flask.Flask(__name__)


@app.route('/')
def index():
    updates = [{"name": "a{}".format(pos), "url": "/a{}".format(pos)} for pos in range(8)]
    return flask.render_template('index.html', updates=updates)


@app.route('/<manga>')
def manga_route(manga):
    chapters = [{
        "name": "chapter {}".format(pos),
        "url": "/{}/{}".format(manga, pos)
    } for pos in range(1, 5)]
    return flask.render_template('manga.html', name=manga, chapters=chapters)


def check_number(nb):
    try:
        nb = int(nb)
    except:
        flask.abort(404)
    if nb > 4 or nb < 1:
        flask.abort(404)
    if nb < 4:
        next = nb + 1
    else:
        next = None
    if nb > 1:
        prev = nb - 1
    else:
        prev = None
    return (nb, next, prev)


@app.route('/<manga>/<chapter>')
def manga_chapter(manga, chapter):
    (chapter, next_chap, prev_chap) = check_number(chapter)
    return flask.render_template(
        'chapter.html',
        name=manga,
        chapter=chapter,
        ajax="ajax" in flask.request.args,
        next_chap=next_chap,
        prev_chap=prev_chap)


@app.route('/<manga>/<chapter>/<page>')
def manga_chapter_page(manga, chapter, page):
    (chapter, next_chap, prev_chap) = check_number(chapter)
    (page, next_page, prev_page) = check_number(page)
    return flask.render_template(
        'page.html',
        name=manga,
        chapter=chapter,
        page=page,
        ajax="ajax" in flask.request.args,
        next_chap=next_chap,
        prev_chap=prev_chap,
        next_page=next_page,
        prev_page=prev_page)
