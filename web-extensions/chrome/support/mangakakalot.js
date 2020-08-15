function MangaKakalotComPlugin() {
}

MangaKakalotComPlugin.prototype.getInfos = function(url, doc) {
    var parts = url.split('/').filter(s => s.length !== 0);

    if (parts.length < 1) {
        return null;
    } else if (parts[parts.length - 1].indexOf("chapter_") !== 0) {
        // manga page
        var elem = doc.querySelector(".manga-info-top>.manga-info-text>li>h1");
        if (!elem) {
            // TODO: add log
            console.log("Cannot get manga title");
            return null;
        }
        var name = elem.innerText;

        elem = doc.querySelector(".chapter-list>.row a");
        if (!elem) {
            // TODO: add log
            console.log("Cannot get manga ID from chapters list");
            return null;
        }
        var id = elem.getAttribute("href").split("/chapter/")[0].split("/")[0];
        return { common: { name, chapter: null, page: null }, id, homeUrl: url };
    }
    // chapter page
    var elems = cloneArray(doc.querySelectorAll(".breadcrumb > p > span > a"));
    if (elems.length < 3) {
        // TODO: add log
        console.log("Cannot get manga home page nor its name");
        return null;
    }
    var name = elems[1].children[0].innerText;
    var homeUrl = elems[1].getAttribute("href").split("mangakakalot.com")[1];
    var parts = url.split("/");
    var chapter = parts[parts.length - 1].split("_");
    chapter = parseInt(chapter[chapter.length - 1]);
    var id = parts[parts.length - 2];

    return { common: { name, chapter, page: null }, id, homeUrl };
};

MangaKakalotComPlugin.prototype.computeURL = function(comicInfo) {
    // At the time of development, MangaKakalot SSL certificate seems legit and
    // working out of the box, so we might as well enforce HTTPS as a default.
    // Might be configurable later on.
    if (comicInfo.common.chapter) {
        return `https://mangakakalot.com/chapter/${comicInfo.id}/chapter_${comicInfo.common.chapter}`;
    }
    return `https://mangakakalot.com/${comicInfo.homeUrl}`;
};
