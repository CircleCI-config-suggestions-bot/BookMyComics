/**
 * This class is a proxy object which handles all supported sources and
 * provides utility functions to use the right piece of code, according to the
 * origin provided as method parameter.
 * It is used by any piece of code which requires to be loosely coupled to the
 * supported sources code.
 *
 * @class
 */
function BmcSources() {
    this._readers = {};
    const sourceDescs = [
        {
            key: "www.mangaeden.com",
            makeObj: () => new MangaEdenComPlugin(),
        },
        {
            key: "fanfox.net",
            makeObj: () => new FanFoxNetPlugin(),
        },
        {
            key: "mangahere.us",
            makeObj: () => new MangaHereUsPlugin(),
        },
        {
            key: "www.mangareader.net",
            makeObj: () => new MangaReaderNetPlugin(),
        },
    ];
    const bro = getBrowser();
    sourceDescs.forEach(desc => {
        try {
            this._readers[desc.key] = desc.makeObj();
        } catch(e) {
            console.error(`Could not load script for ${desc.key}: ${e.message}`);
        }
    });
}

BmcSources.prototype._fromOrigin = function(origin) {
    const readerKey = Object.keys(this._readers).find(
        key => origin.indexOf(key) !== -1);
    if (! readerKey) {
        console.warn('Could not find reader instance.');
        return undefined;
    }
    return this._readers[readerKey];
}

BmcSources.prototype.parseURL = function(origin, url) {
    return this._fromOrigin(origin).parseURL(url);
}

BmcSources.prototype.computeURL = function(origin, info) {
    return this._fromOrigin(origin).computeURL(info);
}
