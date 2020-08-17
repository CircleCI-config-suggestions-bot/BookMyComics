function MangaHereUsPlugin() {
}

MangaHereUsPlugin.prototype.getInfos = function(url) {
    var parts = url.split('/').filter(s => s.length !== 0);

    var name = null;
    var chapter = null;
    var page = null;
    if (parts.length === 2 && parts[0] === 'manga') {
        name = parts[1];
    } else if (parts.length === 1) {
        var urlParts = parts[0].split('-chapter-');
        if (urlParts.length < 2) {
            return null;
        } else if (urlParts.length > 1) {
            name = urlParts[0];
            chapter = urlParts[1];
            page = 1;
        }
        if (window.location.search.length > 0) {
            var pageParts = window.location.search.split('page=');
            if (pageParts.length > 1) {
                page = parseInt(pageParts[1].split('&')[0], 10);
            }
        }
    } else {
        return null;
    }

    return { common: { name, chapter, page }};
};

MangaHereUsPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaHere.us SSL certificate is not detected
    // as legit by standard browser, and a manual exception record is required.
    // As such, we use HTTP and not HTTPS as the default.
    // Might be configurable later on.
    let url = `http://mangahere.us/${comicInfo.common.name}`;
    if (comicInfo.common.chapter) {
        url += `-chapter-${comicInfo.common.chapter}`;
    }
    if (comicInfo.common.page) {
        url += `?page=${comicInfo.common.page}`;
    }
    return url;
};
