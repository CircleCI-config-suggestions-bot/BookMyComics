/* globals
    BmcDataAPI:readable
    BmcMessagingHandler:readable
    BmcSources:readable
    BmcUI:readable
    LOGS:readable
*/

const sources = new BmcSources();
const ENGINE_ID = 'BookMyComics::Engine';

/**
 * This class provides the internal logic for the extension.
 * Depending on the method, it can optionally spawn an UI element, or generate
 * events.
 *
 * @class BmcEngine
 */
function BmcEngine(hostOrigin) {
    this._hostOrigin = hostOrigin;
    this._db = new BmcDataAPI();
    LOGS.log('S14', {'elem': 'BmcDataAPI'});
    this._messaging = new BmcMessagingHandler(this._hostOrigin);
    LOGS.log('S14', {'elem': 'BmcMEssagingHandler'});
    this._ui = new BmcUI(this._messaging, this._db);
    LOGS.log('S14', {'elem': 'BmcUI'});

    // Re-use DOM-style events by using a null-text node underneath
    this._eventCore = document.createTextNode(null);
    this.addEventListener = this._eventCore.addEventListener.bind(this._eventCore);
    this.removeEventListener = this._eventCore.removeEventListener.bind(this._eventCore);
    this.dispatchEvent = this._eventCore.dispatchEvent.bind(this._eventCore);

    // Setup listeners for messages, which should be directly handled by the core.
    // Handle "URLOpen"
    this._messaging.addWindowHandler(
        ENGINE_ID,
        evData => evData.type === 'action' && evData.action === 'urlopen',
        evData => {
            window.location.replace(evData.url);
        });
    // Handle "Comic information query"
    this._messaging.addWindowHandler(
        ENGINE_ID,
        evData => evData.type === 'query' && evData.action === 'comic information',
        () => {
            this.sendNotificationWithComicInfo('Comic Information', null);
        });
}

BmcEngine.prototype.refresh_comic = function(cb) {
    const readerName = window.location.hostname;
    // The `href.slice()` is used to ensure we include the hash part in the provided URL
    const loc = window.location;
    var comic = sources.getInfos(loc.host, loc.href.slice(loc.origin.length), document.body);
    // Log about comic info retrieval
    if (comic) {
        LOGS.log('S41', {'data': JSON.stringify(comic)});
    } else {
        LOGS.error('E0022');
    }
    let sanitizedInfo = comic || { common: {} };

    // Reuse this._comic if already set
    this._comic = {
        reader: readerName,
        info: sanitizedInfo,
        name: sanitizedInfo.common.name,
        chapter: sanitizedInfo.common.chapter,
        page: sanitizedInfo.common.page,
        id: (this._comic || {}).id || undefined,
        memoizing: false,
    };
    // Only when relevant, setup the listeners for internal events,
    // and launch the asynchronous necessary loads
    if (this._comic.name) {
        // utility that will remember the comic ID and serve as a cache
        if (cb) {
            return this._forceMemoizeComic(cb);
        }
        return this._memoizeComic();
    }
};

/*
 * Dicts of constants (names) for the various events available through
 * BmcEngine
 */
BmcEngine.prototype.events = {
    load: 'engine.load',
};

/**
 * Utility function to dispatch the comicId load completion event.
 */
BmcEngine.prototype._dispatchLoad = function () {
    this.dispatchEvent(new CustomEvent(this.events.load));
};

/**
 * Utility function that loads the comic's ID if any, and memorizes/caches it
 * (hence memoize) to accelerate later requests.
 *
 * If a memoization (active loading) is ongoing, no new request will be made,
 * but the completion event will still notify the beforehand registered
 * eventListener that the comicId is resolved.
 * This method allows to offer an unique behavior based on event communication,
 * whether the comicId was already resolved or not.
 *
 */
BmcEngine.prototype._memoizeComic = function () {
    if (this._comic.name === undefined
        || this._comic.name === null
        || typeof this._comic.name !== 'string'
        || this._comic.name === '') {
        LOGS.warn('E0001');
        return;
    }
    if (this._comic.id !== undefined) {
        // console.log(`BmcEngine._memoizeComic: Cache Hit (${this._comic.id}).`);
        this._dispatchLoad();
        return ;
    }
    if (this._comic.memoizing) {
        // console.log('BmcEngine._memoizeComic: Memoize request already pending.');
        return ;
    }
    this._comic.memoizing = true;
    this._db.findComic(this._comic.reader, this._comic.name, (err, comicId) => {
        // console.log('BmcEngine._memoizeComic: memoized id=', comicId);
        this._comic.id = comicId;
        this._comic.memoizing = false;
        this._dispatchLoad();
        this.sendNotificationWithComicInfo();
    });
};

/*
 * This function is the main window's entry point to setup the add-on's
 * necessary utilities (UI, background process, etc.)
 * It requires the current page's comis info, for any UI that might need to be
 * spawned and would require it.
 *
 */
BmcEngine.prototype.setup = function() {
    // Detect AJAX-driven URL/hash changes in order to trigger tracking on AJAX
    // browsing
    window.addEventListener('hashchange', () => {
        this.refresh_comic(() => {
            this.track();
        });
    });

    // A bit of stateful data, so that we can avoid re-checking the storage
    // everytime (and thus speed-up a bit the logic that spawn the UI bits)
    this.refresh_comic();

    return this._ui.makeSidePanel(
        () => this.track(),
        this._hostOrigin);
};

/*
 * This function is the entrypoint for a reader page, which spawns the right UI
 * piece according to the situation.
 *
 * The reader's page must send any available information relative to the
 * displayed comic (if any).
 *
 */
BmcEngine.prototype.track = function() {
    if (!this._comic.name) {
        LOGS.log('S6');
        return ;
    }
    LOGS.log('S7', {'manga': this._comic.name,
                    'chapter': this._comic.chapter,
                    'page': this._comic.page});

    // One single way to handle this, whether the id was already memoized or
    // not: use the event handling.
    LOGS.warn('E0007', {'event': this.events.load});
    this.addEventListener(this.events.load, () => {
        LOGS.log('S9', {'id': this._comic.id});
        if (this._comic.id === null) {
            this._ui.makeRegisterDialog();
            return;
        }
        this._db.updateComic(
            this._comic.id, this._comic.chapter, this._comic.page,
            err => this.sendNotificationWithComicInfo('track', err));
    }, {once: true});

    // Now fire the load or cache hit, that shall trigger the previously
    // registered event listener
    this._memoizeComic();
};

BmcEngine.prototype.sendNotificationWithComicInfo = function(event, err) {
    this._ui.makeNotification(
        event,
        err,
        {
            'comic': {
                'id': this._comic.id,
                'reader': this._comic.reader,
                'name': this._comic.name,
                'page': this._comic.page,
                'chapter': this._comic.chapter,
            },
        }
    );
};
