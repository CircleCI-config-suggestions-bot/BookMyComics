/* globals
    LOGS:readable
    cloneArray
*/

function IsekaiScanComPlugin() {
}

IsekaiScansComPlugin.prototype.getInfos = function(url, doc) {
    let parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 2) {
        return null;
    } else if (parts[parts.length - 1].indexOf('chapter-') !== 0) {
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
        let id = elem.getAttribute('href').split('/chapter-')[0].split('/manga/')[1];
        return { common: { name, chapter: null, page: null }, id, homeUrl: url };
    }
    // chapter page
    let elem = doc.querySelector('#manga-reading-nav-head .breadcrumb > li:nth(1) > a');
    if (!elem) {
        LOGS.log('S79');
        return null;
    }
    let name = elem.innerText;
    let homeUrl = elem.getAttribute('href');
    let chapter = parseInt(elem.nextSibling.innerText.split(' ')[1]);
    let id = homeUrl.split('/chapter-')[0].split('/manga/')[1];

    return { common: { name, chapter, page: null }, id, homeUrl };
};

IsekaiScansComPlugin.prototype.computeURL = function(comicInfo) {
    if (comicInfo.common.chapter) {
        return `https://isekaiscan.com/manga/${comicInfo.id}/chapter-${comicInfo.common.chapter}`;
    }
    return comicInfo.homeUrl;
};
