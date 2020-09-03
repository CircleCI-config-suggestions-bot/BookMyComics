/* globals
    MangaEdenComPlugin:readable
    FanFoxNetPlugin:readable
    MangaHereUsPlugin:readable
    MangaReaderNetPlugin:readable
    MangaNeloComPlugin:readable
    MangaKakalotComPlugin:readable
*/

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
}

BmcSources.prototype._load = function(origin) {
    const sourceDescs = [
        {
            key: 'www.mangaeden.com',
            makeObj: () => new MangaEdenComPlugin(),
        },
        {
            key: 'fanfox.net',
            makeObj: () => new FanFoxNetPlugin(),
        },
        {
            key: 'mangahere.us',
            makeObj: () => new MangaHereUsPlugin(),
        },
        {
            key: 'www.mangareader.net',
            makeObj: () => new MangaReaderNetPlugin(),
        },
        {
            key: 'manganelo.com',
            makeObj: () => new MangaNeloComPlugin(),
        },
        {
            key: 'mangakakalot.com',
            makeObj: () => new MangaKakalotComPlugin(),
        },
    ];
    sourceDescs.forEach(desc => {
        if (desc.key === origin) {
            try {
                this._readers[desc.key] = desc.makeObj();
            } catch(e) {
                // eslint-disable-next-line no-console
                console.error(`Could not load script for ${desc.key}: ${e.message}`);
            }
        }
    });
};

// `preventRecurse` argument is optional, its value is `false` by default.
BmcSources.prototype._fromOrigin = function(origin, preventRecurse) {
    if (typeof preventRecurse === 'undefined') {
        preventRecurse = false;
    }
    const readerKey = Object.keys(this._readers).find(key => origin.indexOf(key) !== -1);
    if (!Object.prototype.hasOwnProperty.call(this._readers, readerKey)) {
        this._load(origin);
        if (preventRecurse !== true) {
            return this._fromOrigin(origin, true);
        }
        // FIXME: david, fix it please!
        // eslint-disable-next-line no-console
        console.warn('Could not find reader instance.');
        return undefined;
    }
    return this._readers[readerKey];
};

BmcSources.prototype.computeURL = function(origin, info) {
    var ori = this._fromOrigin(origin);
    return ori ? ori.computeURL(info) : null;
};

BmcSources.prototype.getInfos = function(origin, url, doc) {
    var ori = this._fromOrigin(origin);
    return ori ? ori.getInfos(url, doc) : null;
};
