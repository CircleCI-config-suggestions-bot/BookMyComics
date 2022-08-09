/* globals
    BmcComicSource:readable
    BmcComic:readable
*/

function BookMyComicsTestPlugin() {
}

BookMyComicsTestPlugin.prototype.getInfos = function(url /*, doc -- unused */) {
    const comic = new BmcComic(null, null, null, null, null);
    let source = null;
    const parts = url.split('/').filter(s => s.length !== 0);
    let manga = null;
    let chapter = null;
    let page = null;

    if (parts.length < 1) {
        return null;
    }
    if (parts.length >= 1) {  // Has manga
        manga = parts[0];
        comic.label = manga;
    }
    if (parts.length >= 2) {  // Has chapter
        chapter = parts[1];
    }
    if (parts.length >= 3) {  // Has page
        page = parts[2];
    }
    source = new BmcComicSource(
        comic.label,
        'localhost',
        {id: manga}
    );
    comic.chapter = chapter;
    comic.page = page;
    comic.addSource(source);
    return comic;
};

BookMyComicsTestPlugin.prototype.computeURL = function(comic, source) {
    if (comic.page) {
        return `http://localhost:5000/${source.info.id}/${comic.chapter}/${comic.page}`;
    }
    if (comic.chapter) {
        return `http://localhost:5000/${source.info.id}/${comic.chapter}`;
    }
    return `http://localhost:5000/${source.info.id}`;
};

BookMyComicsTestPlugin.prototype.hasNextPage = function(doc) {
    const pg = doc.querySelector('body>div#buttons>button#next');
    const chap = doc.querySelector('body>div#buttons>button#next-page');
    return (chap !== null || pg !== null);
};
