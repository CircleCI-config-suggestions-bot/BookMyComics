/* globals
    LOGS:readable
*/

function FanFoxNetPlugin() {
}

FanFoxNetPlugin.prototype.getInfos = function(url, doc) {
    var parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 3) {
        return null;
    }
    if (parts.length < 4) {  // Manga HomePage
        let elem = doc.querySelector('.reader-header-title-1 > a');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        let name = elem.innerText;
        let id = url.split('/manga/')[1].split('/')[0];
        return { common: { name, chapter: null, page: null }, id, homeUrl: url };
    }
    // Chapter/page
    let elem = doc.querySelector('.reader-header-title-1 > a');
    if (!elem) {
        LOGS.log('S77');
        return null;
    }
    let name = elem.innerText;
    let homeUrl = elem.getAttribute('href');
    let link_parts = url.split('/manga/')[1].split('/');
    let id = link_parts[0];
    let chapter = parseInt(link_parts[1].replace('c', ''), 10);
    let page = link_parts[2].replace('.html', '');
    // BEWARE ! On FanFox, browsing uses ajax, and may update browsing url
    // with a '#' anchor to show which page is currently viewed. The HTML
    // number may actually only be the initially loaded page within a
    // chapter.
    const pparts = page.split('#');
    if (pparts.length === 2) {
        page = pparts[1].replace('ipg', '');
    }

    return { common: { name, chapter, page }, id: id, homeUrl: homeUrl};
};

FanFoxNetPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, FanFox SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    let url = `https://fanfox.net/manga/${comicInfo.id}`;
    if (comicInfo.common.chapter) {
        url += `/c${comicInfo.common.chapter.toString().padStart(3, '0')}/${comicInfo.common.page}.html`;
        if (comicInfo.common.page !== '1') {
            url = `${url}#ipg${comicInfo.common.page}`;
        }
    }
    return url;
};
