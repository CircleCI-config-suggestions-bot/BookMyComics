/* globals
    LOGS:readable
    cloneArray
*/

function MangaNatoComPlugin() {
}

MangaNatoComPlugin.prototype.getInfos = function(url, doc) {
    let parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 1) {
        return null;
    } else if (parts[parts.length - 1].indexOf('chapter-') !== 0) {
        // manga page
        let elem = doc.querySelectorAll('.panel-story-info>.story-info-right>h1')[1];
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        let name = elem.innerText;
        let id = url.split('/')[1].split('-')[1];
        return { common: { name, chapter: null, page: null }, id, homeUrl: url };
    }
    // chapter page
    let elems = cloneArray(doc.querySelectorAll('.panel-breadcrumb > a.a-h'));
    if (elems.length < 3) {
        LOGS.log('S79');
        return null;
    }
    let name = elems[1].innerText;
    let homeUrl = elems[1].getAttribute('href').split('manganato.com')[1];
    let chapter = parseInt(parts[parts.length - 1].split('-')[1]);
    let id = parts[parts.length - 2].split('-')[1];

    return { common: { name, chapter, page: null }, id, homeUrl };
};

MangaNatoComPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaKakalot SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    if (comicInfo.common.chapter) {
        return `https://readmanganato.com/manga-${comicInfo.id}/chapter-${comicInfo.common.chapter}`;
    }
    return `https://readmanganato.com${comicInfo.homeUrl}`;
};
