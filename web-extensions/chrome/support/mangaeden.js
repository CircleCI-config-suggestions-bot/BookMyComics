function MangaEdenComPlugin() {
}

MangaEdenComPlugin.prototype.parseURL = function(url) {
    var parts = url.split("/").filter(s => s.length !== 0);

    if (parts.length < 3) {
        return null;
    }
    var lang = parts[0];
    var readingLang = parts[1];
    var name = parts[2];
    var chapter = null;
    var page = null;
    if (parts.length > 4) {
        chapter = parts[3];
        page = parts[4];
    }

    return { common: { name, chapter, page }, lang, readingLang };
};

MangaEdenComPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaEden SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    let url = `https://www.mangaeden.com/${comicInfo.lang}/${comicInfo.readingLang}/${comicInfo.common.name}`;
    if (comicInfo.common.chapter) {
        url += `/${comicInfo.common.chapter}/${comicInfo.common.page || 1}/`;
    }
    return url;
};
