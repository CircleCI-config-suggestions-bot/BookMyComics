function MangaReaderNetPlugin() {
}

MangaReaderNetPlugin.prototype.parseURL = function(url) {
    var parts = url.split("/").filter(function(s) { return s.length !== 0});
    var not_mangas = ["popular", "search", "alphabetical", "latest", "random"];

    if (parts.length < 1) {
        return null;
    }
    for (var i = 0; i < not_mangas.length; ++i) {
        if (parts[0] === not_mangas[i]) {
            return null;
        }
    }
    var name = parts[0];
    var chapter = null;
    var page = null;
    if (parts.length > 1) {
        chapter = parts[1];
        if (parts.length > 2) {
            page = parts[2];
        } else {
            page = 1;
        }
    }

    return { common: { name, chapter, page }};
}

MangaReaderNetPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaReader SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    let url = `https://www.mangareader.net/${comicInfo.common.name}`;
    if (comicInfo.common.chapter) {
        url += `/${comicInfo.common.chapter}/${comicInfo.common.page}`;
    }
    return url;
}
