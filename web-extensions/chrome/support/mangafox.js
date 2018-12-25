function FanFoxNetPlugin() {
}

FanFoxNetPlugin.prototype.parseURL = function(url) {
    var parts = url.split("/").filter(function(s) { return s.length !== 0});

    if (parts.length < 2) {
        return null;
    }
    var name = parts[1];
    var chapter = null;
    var page = null;
    if (parts.length > 3) {
        chapter = parseInt(parts[2].replace('c', ''), 10);
        page = parts[3].replace('.html', '');
        // BEWARE ! On FanFox, browsing uses ajax, and may update browsing url
        // with a '#' anchor to show which page is currently viewed. The HTML
        // number may actually only be the initially loaded page within a
        // chapter.
        pparts = page.split('#');
        if (pparts.length === 2) {
            page = pparts[1].replace('ipg', '');
        }
    }

    return { common: { name, chapter, page }};
}
