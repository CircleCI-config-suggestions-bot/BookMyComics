/* globals
    LOGS:readable
    cloneArray
*/

function MangaNeloComPlugin() {
}

MangaNeloComPlugin.prototype.getInfos = function(url, doc) {
    let parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 1) {
        return null;
    } else if (parts[parts.length - 1].indexOf('chapter_') !== 0) {
        // manga page
        let elem = doc.querySelector('.panel-story-info>.story-info-right>h1');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        let name = elem.innerText;

        elem = doc.querySelector('ul.row-content-chapter>li.a-h>a.chapter-name');
        if (!elem) {
            LOGS.log('S78');
            return null;
        }
        let id = elem.getAttribute('href').split('/chapter/')[0].split('/')[0];
        return { common: { name, chapter: null, page: null }, id, homeUrl: url };
    }
    // chapter page
    let elems = cloneArray(doc.querySelectorAll('.panel-breadcrumb > a.a-h'));
    if (elems.length < 3) {
        LOGS.log('S79');
        return null;
    }
    let name = elems[1].innerText;
    let homeUrl = elems[1].getAttribute('href').split('manganelo.com')[1];
    let chapter = parts[parts.length - 1].split('_');
    chapter = parseInt(chapter[chapter.length - 1]);
    let id = parts[parts.length - 2];

    return { common: { name, chapter, page: null }, id, homeUrl };
};

MangaNeloComPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaKakalot SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    if (comicInfo.common.chapter) {
        return `https://manganelo.com/chapter/${comicInfo.id}/chapter_${comicInfo.common.chapter}`;
    }
    return `https://manganelo.com/${comicInfo.homeUrl}`;
};
