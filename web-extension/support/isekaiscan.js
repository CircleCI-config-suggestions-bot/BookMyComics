/* globals
    LOGS:readable
*/

function IsekaiScanComPlugin() {
}

IsekaiScanComPlugin.prototype.getInfos = function(url, doc) {
    let parts = url.split('/').filter(s => s.length !== 0);
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
        return { common: { name, chapter: null, page: null },
                 id, homeUrl: url, prefixes: {chapter: null}};
    }
    // chapter page
    let elem = doc.querySelector('#manga-reading-nav-head .breadcrumb > li:nth-child(2) > a');
    if (!elem) {
        LOGS.log('S79');
        return null;
    }
    let name = elem.innerText;
    let homeUrl = elem.getAttribute('href');
    // XXX BUG XXX:
    // Found some chapters numbered `chapter-0-2` (2nd version of chapter 0 ?)
    // As such, and to provide an uniform reading experience throughout the
    // supported readers, we'll only keep the first number...
    // -> We acknowledge this may lead to a non-functional link later on
    let chapter = parseInt(url.split('/')[3].split('-')[1]);
    let id = homeUrl.split('/manga/')[1].split('/')[0];

    return { common: { name, chapter, page: null },
             id, homeUrl, prefixes: {chapter: chapter_prefix}};
};

IsekaiScanComPlugin.prototype.computeURL = function(comicInfo) {
    if (comicInfo.common.chapter !== null) {
        return `https://isekaiscan.com/manga/${comicInfo.id}/${comicInfo.prefixes.chapter}-${comicInfo.common.chapter}`;
    }
    return comicInfo.homeUrl;
};
