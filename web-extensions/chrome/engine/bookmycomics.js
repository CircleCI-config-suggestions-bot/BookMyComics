/**
 * This class provides the internal logic for the extension.
 * Depending on the method, it can optionally spawn an UI element, or generate
 * events.
 *
 * @class BmcEngine
 */
function BmcEngine() {
    this._db = new BmcDataAPI();
    console.log('Instanciated BmcDataAPI');
    this._ui = new BmcUI();
    console.log('Instanciated BmcUI');

    // Re-use DOM-style events by using a null-text node underneath
    this._eventCore = document.createTextNode(null);
    this.addEventListener = this._eventCore.addEventListener.bind(this._eventCore);
    this.removeEventListener = this._eventCore.removeEventListener.bind(this._eventCore);
    this.dispatchEvent = this._eventCore.dispatchEvent.bind(this._eventCore);
}

/*
 * Dicts of constants (names) for the various events available through
 * BmcEngine
 */
BmcEngine.prototype.events = {
    register: {
        error: 'register.error',
        complete: 'register.done',
    },
    alias: {
        error: 'alias.error',
        complete: 'alias.done',
    },
    ignore: {
        error: 'ignore.error',
        complete: 'ignore.done',
    },
};

/*
 * This function is the entrypoint for a reader page, which spawns the right UI
 * piece according to the situation.
 *
 * The reader's page must send any available information relative to the
 * displayed comic (if any).
 *
 * @params {String} comicName - Name of the comic according to the reader
 * @params {Number} chapter - Current chapter of the comic according to the
 *                            reader's page
 * @params {Number|null} page - Current page of the comic according to the
 *                              reader's page
 *
 */
BmcEngine.prototype.track = function(comicName, chapter, page) {
    console.log(`BookMyComic: bmcEngine.track: manga=${comicName} chapter=${chapter} page=${page}`);
    this._db.findComic(comicName, (err, comicId) => {
        if (err) {
            console.log('BookMyComic: Could not track comic: Database error (step1)');
            return ;
        }
        console.log(`BookMyComic: bmcEngine.track: Got comicId from storage: ${comicId}`);
        if (comicId === null) {
            return this._ui.makeRegisterDialog(comicName, chapter, page);
        }
        this._db.updateComic(comicId, chapter, page,
                             err => this._ui.makeTrackingNotification(err));
    });
};

/*
 * This function registers a comic into the saved data. It shall be used by the
 * user-interacting UI spawned on an online reader's page.
 *
 * @params {String} comicName - Name of the comic according to the reader
 * @params {Number} chapter - Current chapter of the comic according to the
 *                            reader's page
 * @params {Number|null} page - Current page of the comic according to the
 *                              reader's page
 *
 */
BmcEngine.prototype.register = function(comicName, chapter, page) {
    console.log(`BookMyComic: bmcEngine.register: manga=${comicName} chapter=${chapter} page=${page}`);
    this.dispatchEvent(new CustomEvent(this.events.register.complete));
};

/*
 * This function registers a new name for an existing comic into the saved data.
 * Then, it also updates the progress of reading for this comic.
 *
 * @params {String} comicName - Name of the comic according to the reader
 * @params {Number} chapter - Current chapter of the comic according to the
 *                            reader's page
 * @params {Number|null} page - Current page of the comic according to the
 *                              reader's page
 *
 */
BmcEngine.prototype.alias = function(comicName, chapter, page) {
    console.log(`BookMyComic: bmcEngine.alias: manga=${comicName} chapter=${chapter} page=${page}`);
    this.dispatchEvent(new CustomEvent(this.events.alias.complete));
};

/*
 * This function registers a comic into the "Ignore List" in the saved data.
 * TODO: Ideally, it should be registered along with some data allowing the
 * extension to offer registering the manga again, according to the user
 * settings.
 *
 * @params {String} comicName - Name of the comic according to the reader
 * @params {Number} chapter - Current chapter of the comic according to the
 *                            reader's page
 * @params {Number|null} page - Current page of the comic according to the
 *                              reader's page
 *
 */
BmcEngine.prototype.ignore = function(comicName, chapter, page) {
    console.log(`BookMyComic: bmcEngine.ignore: manga=${comicName} chapter=${chapter} page=${page}`);
    this.dispatchEvent(new CustomEvent(this.events.ignore.complete));
};
