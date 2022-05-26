/* globals
    BmcComicSource:readable
    BmcComic:readable
    LOGS:readable
*/

function IsekaiScanComPlugin() {
}

IsekaiScanComPlugin.prototype.getInfos = function(url, doc) {
    const comic = new BmcComic(null, null, null, null, null);
    let source = null;
    const parts = url.split('/').filter(s => s.length !== 0);
    let chapter_prefix = null;

    if (url.indexOf('chapter-') !== -1) {
        chapter_prefix = 'chapter';
    }
    else if (url.indexOf('ch-') !== -1) {
        chapter_prefix = 'ch';
    }

    if (parts.length < 2) {
        return null;
    } else if (parts[parts.length - 1].indexOf(`${chapter_prefix}-`) !== 0) {
        // manga page
        let elem = doc.querySelector('.profile-manga>.container .breadcrumb > li:last-child > a');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        let name = elem.innerText;

        elem = doc.querySelector('#manga-chapters-holder .wp-manga-chapter > a');
        if (!elem) {
            LOGS.log('S78');
            return null;
        }
        let id = elem.getAttribute('href').split('/manga/')[1].split('/')[0];
        source = new BmcComicSource(name, 'isekaiscan.com', {id, homeUrl: url, prefixes: {chapter: null}});
        comic.addSource(source);
    } else {
        // chapter page
        let elem = doc.querySelector('#manga-reading-nav-head .breadcrumb > li:nth-child(2) > a');
        if (!elem) {
            LOGS.log('S79');
            return null;
        }
        let name = elem.innerText;
        let homeUrl = elem.getAttribute('href');
        // Found some chapters numbered `chapter-0-2` (2nd version of chapter 0 ?)
        let chapter = url.split('/')[3].split('-').splice(1);
        let id = homeUrl.split('/manga/')[1].split('/')[0];
        source = new BmcComicSource(name, 'isekaiscan.com', {id, homeUrl, prefixes: {chapter: chapter_prefix}});
        comic.addSource(source);
        comic.chapter = chapter;
    }

    return comic;
};

IsekaiScanComPlugin.prototype.computeURL = function(comic, source) {
    if (comic.chapter !== null) {
        // Backwards-compat to before chapter was an array of sub-numberings
        let chapter_ref = comic.chapter;
        if (Array.isArray(comic.chapter)) {
            chapter_ref = comic.chapter.join('-');
        }
        return `https://isekaiscan.com/manga/${source.info.id}/${source.info.prefixes.chapter}-${chapter_ref}`;
    }
    return comic.homeUrl;
};
