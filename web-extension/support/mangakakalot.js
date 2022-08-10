/* globals
    BmcComicSource:readable
    BmcComic:readable
    LOGS:readable
    cloneArray
*/

function MangaKakalotComPlugin() {
}

MangaKakalotComPlugin.prototype.getInfos = function(url, doc) {
    const comic = new BmcComic(null, null, null, null, null);
    let source = null;
    let parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 1) {
        return null;
    } else if (parts[parts.length - 1].indexOf('chapter_') !== 0) {
        // manga homepage
        let elem = doc.querySelector('.manga-info-top>.manga-info-text>li>h1');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        let name = elem.innerText;

        elem = doc.querySelector('.chapter-list>.row a');
        if (!elem) {
            LOGS.log('S78');
            return null;
        }
        let id = elem.getAttribute('href').split('/chapter/')[0].split('/')[0];
        source = new BmcComicSource(name, 'mangakakalot.com', {id, homeUrl: url.split('mangakakalot.com')[1]});
        comic.addSource(source);
    } else {
        // chapter page
        let elems = cloneArray(doc.querySelectorAll('.breadcrumb > p > span > a'));
        if (elems.length < 3) {
            LOGS.log('S79');
            return null;
        }
        let name = elems[1].children[0].innerText;
        let homeUrl = elems[1].getAttribute('href').split('mangakakalot.com')[1];
        const ctoks = parts[parts.length - 1].split('_');
        const chapter = ctoks[ctoks.length - 1].split('.');
        let id = parts[parts.length - 2];
        source = new BmcComicSource(name, 'mangakakalot.com', {id, homeUrl});
        comic.addSource(source);
        comic.chapter = chapter;
    }

    return comic;
};

MangaKakalotComPlugin.prototype.computeURL = function(comic, source) {
    // At the time of development, MangaKakalot SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    if (comic.chapter) {
        // Backwards-compat to before chapter was an array of sub-numberings
        let chapter_ref = comic.chapter;
        if (Array.isArray(comic.chapter)) {
            chapter_ref = comic.chapter.join('.');
        }
        return `https://mangakakalot.com/chapter/${source.info.id}/chapter_${chapter_ref}`;
    }
    return `https://mangakakalot.com/${source.info.homeUrl}`;
};

MangaKakalotComPlugin.prototype.hasNextPage = function(doc) {
    const elem = doc.querySelector('.btn-navigation-chap > .back');
    return elem !== null;
};
