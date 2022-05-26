/* globals
    BmcComicSource:readable
    BmcComic:readable
    LOGS:readable
    cloneArray:readable
*/

function FanFoxNetPlugin() {
}

FanFoxNetPlugin.prototype.getInfos = function(url, doc) {
    const comic = new BmcComic(null, null, null, null, null);
    let source = null;
    const parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 3) {
        return null;
    }
    if (parts.length < 4) {  // Manga HomePage
        const elem = doc.querySelector('.reader-header-title-1 > a');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        const name = elem.innerText;
        const id = url.split('/manga/')[1].split('/')[0];
        source = new BmcComicSource(name, 'fanfox.net', {id, homeUrl: url});
        comic.addSource(source);
    } else {
        // Chapter/page
        const elem = doc.querySelector('.reader-header-title-1 > a');
        if (!elem) {
            LOGS.log('S77');
            return null;
        }
        const name = elem.innerText;
        const homeUrl = elem.getAttribute('href');
        const link_parts = url.split('/manga/')[1].split('/');
        const id = link_parts[0];
        const chapter = link_parts[1].replace('c', '').split('.');
        let page = link_parts[2].replace('.html', '');
        // BEWARE ! On FanFox, browsing uses ajax, and may update browsing url
        // with a '#' anchor to show which page is currently viewed. The HTML
        // number may actually only be the initially loaded page within a
        // chapter.
        const pparts = page.split('#');
        if (pparts.length === 2) {
            page = pparts[1].replace('ipg', '');
        }
        source = new BmcComicSource(name, 'fanfox.net', {id, homeUrl});
        comic.addSource(source);
        comic.chapter = chapter;
        comic.page = page;
    }

    return comic;
};

FanFoxNetPlugin.prototype.computeURL = function(comic, source) {
    // At the time of development, FanFox SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    let url = `https://fanfox.net/manga/${source.info.id}`;
    if (comic.chapter) {
        // Backwards-compat to before chapter was an array of sub-numberings
        let chapter_ref = comic.chapter.toString().padStart(3, '0');
        if (Array.isArray(comic.chapter)) {
            const subs = cloneArray(comic.chapter).splice(1);
            const ar = [comic.chapter[0].padStart(3, '0')].concat(subs.length ? [subs.join('.')] : []);
            chapter_ref = ar.join('.');
        }
        url += `/c${chapter_ref}/${comic.page ? comic.page : 1}.html`;
        if (comic.page !== null && comic.page !== '1') {
            url = `${url}#ipg${comic.page}`;
        }
    }
    return url;
};

FanFoxNetPlugin.prototype.hasNextPage = function(doc) {
    let pages = null;
    let chapters = null;
    const pagers = doc.getElementsByClassName('pager-list-left');
    for (let i=0; i < pagers.length; i++) {
        if (pagers[i].childElementCount) {
            pages = pagers[i].querySelectorAll('span > a');
            chapters = pagers[i].querySelectorAll('a.chapter');
            break ;
        }
    }

    // Check if we're on the last page of the chapter
    for (let i=0; i < pages.length; i++) {
        if (pages[i].classList.contains('active')) {
            if (i < pages.length - 1) {
                return true;
            }
            // If yes, check if there's a next chapter
            for (let i=0; i < chapters.length; i++) {
                if (chapters[i].text.indexOf('Next') !== -1) {
                    return true;
                }
            }
        }
    }
    return false;
};
