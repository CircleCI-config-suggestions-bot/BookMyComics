function getBrowser() {
    if (typeof browser === "undefined") {
        return chrome;
    }
    return browser;
}

/**
 * This class is a very simple wrapper on top of the various browser's APIs for
 * storage, made to unify them into a simpler-to-user API.
 * It thus handles transparently both standard callback-based asynchronous
 * calls, as well as promises.
 *
 * @class Storage
 */
function Storage() {
    var bro = getBrowser();
    this._area = bro.storage.sync;
    if (!this._area) {
        this._area = bro.storage.local;
    }

    this._mode = this.MODE_CALLBACK;

    /**
     * XXX TODO FIXME
     * This method may not be viable long-term
     *
     * Only Firefox provides 'getBrowserInfo()' method
     * If we have it, we're then using FF, which provides promises instead
     * of requiring callbacks for async calls.
     */
    if (bro.runtime.getBrowserInfo !== undefined) {
        this._mode = this.MODE_PROMISE;
    }
    console.log(`[Wrapper] Selected mode: ${this._mode}`);
}

Storage.prototype.MODE_CALLBACK = 0;
Storage.prototype.MODE_PROMISE = 1;

/**
 * @callback Storage~onSuccess
 * @param [Object] [data] - Data retrieved by reading operations
 */

/**
 * callback Storage~onError
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function is an internal function used to create a unified API,
 * effectively hiding the actual implementation (promises or callback-based
 * asynchronous).
 * It takes a function, its arguments, as well as two completion callbacks for
 * success and failure cases.
 *
 * @param {Function} funcObj - Function to be called
 * @param {Any} args - Arguments to be provided to the function (can be either
 *                     an array of arguments, or a single argument of any type)
 * @param {Storage~onSuccess} onSuccess
 * @param {Storage~onError} onError
 *
 */
Storage.prototype._cbify = function(funcObj, args, onSuccess, onError) {
    switch(this._mode) {
        case this.MODE_PROMISE:
            const promise = funcObj.apply(this, args);
            return promise.then(onSuccess, onError);
        case this.MODE_CALLBACK:
        default:
            function resolveCb(err, data) {
                if (err) {
                    return onError(err);
                }
                return onSuccess(data);
            }
            const allArgs = [];
            allArgs.push(args);
            allArgs.push(resolveCb);
            return funcObj.apply(this, allArgs);
    }
};

/**
 * @callback Storage~getCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Object} data - Object containing the retrieved data
 */

/**
 * This function provides a unified API to get from the storage layers of the
 * browser.
 *
 * @param {String[]|String} keys - Single key or array of keys to retrieve the
 *                                 data of
 * @param {Storage~getCb} cb
 *
 */
Storage.prototype.get = function(keys, cb) {
    console.log('Wrapper.get');
    function onError(err) {
        console.log(`Get Error: ${JSON.stringify(err)}`);
        return cb(err);
    }
    function onSuccess(data) {
        console.log(`Get Success: ${JSON.stringify(data)}`);
        return cb(null, data);
    }
    return this._cbify(this._area.get, keys, onSuccess, onError); 
}

/**
 * @callback Storage~setCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function provides a unified API to write data into the storage layers
 * of the browser.
 *
 * @param {Object] dataset - Dictionary of the key/values to store
 * @param {Storage~setCb} cb
 *
 */
Storage.prototype.set = function(dataset, cb) {
    console.log('Wrapper.set');
    function onError(err) {
        return cb(err);
    }
    function onSuccess() {
        return cb(null);
    }
    return this._cbify(this._area.set, dataset, onSuccess, onError); 
}

/**
 * @callback Storage~removeCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function provides a unified API to remove data from the storage layers
 * of the browser.
 *
 * @param {String[]|String} keys - Single key or array of keys to be removed
 *                                 from the storage
 * @param {Storage~removeb} cb
 *
 */
Storage.prototype.remove = function(keys, cb) {
    console.log('Wrapper.remove');
    function onError(err) {
        return cb(err);
    }
    function onSuccess() {
        return cb(null);
    }
    return this._cbify(this._area.remove, keys, onSuccess, onError); 
}

/**
 * @callback Storage~cleanCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function provides a unified API to delete all data saved by the
 * extension from the storage of the browser.
 *
 * @param {Storage~cleanCb} cb
 *
 */
Storage.prototype.clear = function(cb) {
    console.log('Wrapper.clear');
    function onError(err) {
        return cb(err);
    }
    function onSuccess() {
        return cb(null);
    }
    return this._cbify(this._area.clear, onSuccess, onError); 
}


/**
 * This class handles the keyScheme for all data stored by BookMyComics
 * It relies on a persistent "state", stored and retrieved using the Storage
 * class.
 *
 * Currently, three types of data are available:
 * 1. state: internal add-on state, maintained to make operations easier along
 *           the lifecycle of the extension. 
 * 2. map: Dictionary of names of Comic that maps to Comic ids
 * 3. comic: Stores all data relevant to a tracked comic:
 *    > id: id of the comic (used to find this object in the storage)
 *    > chapter: Chapter number of the last page read
 *    > page: Page number of the last page read. Can be null (to
 *            support full-chapter mode readers).
 *
 * @class KeyScheme
 */
function KeyScheme(storage) {
    this._storage = storage;
}

KeyScheme.prototype.BMC_STATE_KEY = 'BookMyComics.state';
KeyScheme.prototype.BMC_MAP_KEY = 'BookMyComics.map';
KeyScheme.prototype.BMC_KEY_PREFIX = 'BookMyComics.comics';

/**
 * @callback KeyScheme~getMapCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Object} map - Name-to-Id mapping object from the storage
 */

/**
 * This function retrieves the Name-to-Id mapping from the storage,
 * in order to allow manipulating it and update it in an atomic-like manner
 * within other functions/classes.
 *
 * @param {KeyScheme~getMapCb} cb
 *
 */
KeyScheme.prototype.getMap = function(cb) {
    return this._storage.get(this.BMC_MAP_KEY, (err, data) => {
        if (err) {
            console.log('Scheme could not retrieve Comic map');
            return cb(err, null);
        }
        let map = {};
        if (data) {
            map = data;
        }
        return cb(null, map);
    });
};

/**
 * @callback KeyScheme~nextIdCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Number} id - Unique ID for the Comic to be registered
 */

/**
 * This function returns a unique ID, guaranteed unused, for the calling code
 * to register a new Comic under this ID.
 * It automatically updates an internal (persistent) state, keeping track of
 * the last IDs attributed, thus simulating an auto-increment style SQL ID.
 *
 * @param {KeyScheme~nextIdCb} cb
 *
 */
KeyScheme.prototype.nextId = function(cb) {
    return this._storage.get(this.BMC_STATE_KEY, (err, state) => {
        if (err) {
            return cb(err, null);
        }
        const nextId = state.lastId + 1;
        state.lastId += 1;
        this._storage.set(this.BMC_STATE_KEY, state, err => {
            if (err) {
                return cb(err, null);
            }
            return cb(null, nextId);
        });
    });
};

/**
 * This function computes the actual storage key matching a given Unique Comic
 * ID.
 *
 * @param {Number} comicId - Unique ID of the registered Comic
 *
 * @return {String} Storage key matching the comicId
 *
 */
KeyScheme.prototype.keyFromId = function(comicId) {
    return `${BMC_KEY_PREFIX}.${comicId}`;
};

/**
 * @callback KeyScheme~idFromNameCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Number|null} id - Unique ID of the registered Comic. Set to null if
 *                           the comic is not registered.
 */

/**
 * This function looks-up into the Name-to-Id mapping (retrieved from the
 * storage), in order to resolve the Unique ID associated to a Comic name.
 * If the Comic cannot be found, null is provided to the callback.
 *
 * @param {String} name - Name of the Comic
 * @param {KeyScheme~idFromNameCb} cb
 *
 */
KeyScheme.prototype.idFromName = function(name, cb) {
    this._storage.get(this.BMC_MAP_KEY, (err, mapping) => {
        if (err) {
            return cb(err, null);
        }
        let id = null;
        if (mapping && mapping[name] !== undefined) {
            id = mapping[name];
        }
        return cb(null, id);
    });
};


/**
 * This class handles storing, retrieving and searching for data about the
 * Manga/Comics handled by the add-on.
 * It provides a unified interface, which handles both FireFox and
 * Chrome-style APIs.
 *
 * The information about tracked comics is stored using 2 distinct types of
 * objects:
 *
 * @class BmcDataAPI
 */
function BmcDataAPI() {
    this._data = new Storage();
    this._scheme = new KeyScheme(this._data);
}


/**
 * @callback BmcDataAPI~findCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Number|null} id - Unique ID of the registered Comic. Set to null if
 *                           the comic is not registered.
 */

/**
 * This function looks-up into the extension's storage to find the Unique ID
 * matching the requested comic name.
 * If the comic name cannot be found in the storage, null is returned as the
 * id, indicating that the comic can either be aliased to an existing
 * registered comic, or that it can be registered as a new entry.
 *
 * @param {String} name - Name of the comic to look-up
 * @param {BmcDataAPI~findCb} cb
 *
 */
BmcDataAPI.prototype.findComic = function(name, cb) {
    return this._scheme.idFromName(name, (err, id) => {
        if (err) {
            console.log(`Got FIND error: ${JSON.stringify(err)}`);
            return cb(err, null);
        }
        console.log(`Found data: ${JSON.stringify(id)}`);
        return cb(null, id === undefined ? null : id);
    });
};


/**
 * @callback BmcDataAPI~updateCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function updates a registered Comic's tracking payload.
 * It must only be used to update known and existing registered Comics, and
 * will fail if the payload cannot be found. Tje Unique id is not checked for
 * validity.
 *
 * @param {Number} comicId - Unique ID of the registered Comic
 * @param {Number} chapter - Chapter number of the last page read
 * @param {Number} page - Page number of the last page read
 * @param {BmcDataAPI~updateCb} cb
 *
 */
BmcDataAPI.prototype.updateComic = function(comicId, chapter, page, cb) {
    const comicKey = this._scheme.keyFromId(comicId);
    return this._data.get(comicKey, (err, data) => {
        if (err) {
            console.log(`Could not find comicId: ${JSON.stringify(err)}`);
            return cb(err);
        }
        if (!data) {
            return cb(new Error('Could not find comic data'));
        }
        const payload = Object.assign({}, data);
        if (payload.chapter > chapter
            || (payload.chapter == chapter
                && (payload.page && page && payload.page >= page))) {
            return cb(new Error('Cannot go backwards in comic'));
        }
        /*
         * XXX TODO FIXME
         * improve logic here, as this allows skipping many pages/chapters at
         * once.
         */
        payload.chapter = chapter;
        payload.page = page;
        return this._data.set({comicKey: payload}, err => {
            if (err) {
                console.log(`Got Update error: ${JSON.stringify(err)}`);
                return cb(err);
            }
            console.log(`Updated comicId ${comicId} successfully`);
            return cb(null);
        });
    });
};


/**
 * @callback BmcDataAPI~registerCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function registers a Comic into the extension's storage.
 * An unique ID is computed at the registration time, and the registration
 * allows setting a chapter and a page rather than requiring a
 * post-registration update.
 *
 * The registration includes:
 *  - Addition of the name->id mapping into the KeyScheme's map
 *  - Definition of the tracking payload for the Comic
 *
 * @param {String} name - Name of the Comic to register
 * @param {Number} chapter - Chapter number of the last page read
 * @param {Number} page - Page number of the last page read
 * @param {BmcDataAPI~registerCb} cb
 *
 */
BmcDataAPI.prototype.registerComic = function(name, chapter, page, cb) {
    return this._scheme.nextId((err, id) => {
        if (err) {
            console.log(`Got error from scheme.nextId(): ${JSON.stringify(err)}`);
            return cb(err);
        }
        return this._scheme.getMap((err, map) => {
            const comicKey = this._scheme.keyFromId(id);
            const dataset = {};
            dataset[comicKey] = {
                id,
                chapter,
                page,
            };
            dataset[this._scheme.BMC_MAP_KEY] = map;
            return this._data.set(dataset, err => {
                return cb(err);
            });
        });
    });
};


/**
 * @callback BmcDataAPI~aliasCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function allows attaching a new Comic name to an existing registered
 * and tracked comic.
 * This is done through the update of the name/id mapping from the KeyScheme.
 *
 * @param {Number} comicId - Unique ID of the registered Comic
 * @param {String} newName - New name to link to the existing registered
 *                           Comic
 * @param {BmcDataAPI~aliasCb} cb
 */
BmcDataAPI.prototype.aliasComic = function(comicId, newName, cb) {
    return this._scheme.getMap((err, map) => {
        map[newName] = comicId;
        const dataset = {};
        dataset[this._scheme.BMC_MAP_KEY] = map;
        return this._data.set(dataset, err => {
            return cb(err);
        });
    });
};


/**
 * @callback BmcDataAPI~unregisterCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function allows unregistering a comic, in a fail-safe manner.
 * The mapping allowing to find the Id from the Comic name and aliases is
 * cleaned first, so that the id cannot be resolved anymore, and then, the
 * tracking payload is cleaned-up, as it has become unreachable.
 * 
 * This prevents an intermediate failure from creating an inconsistent dataset
 * (ie: make a resolvable id point towards removed data).
 *
 * @param {Number} comicId - Unique ID of the registered Comic
 * @param {BmcDataAPI~unregisterCb} cb
 */
BmcDataAPI.prototype.unregisterComic = function(comicId, cb) {
    const comicKey = this._scheme.keyFromId(comicId);
    // First, delete all links from the map
    return this._scheme.getMap((err, map) => {
        map.keys().forEach(key => {
            if (map[key] === comicId) {
                delete map[key];
            }
        });
        const dataset = {};
        dataset[this._scheme.BMC_MAP_KEY] = map;
        return this._data.set(dataset, err => {
            if (err) {
                return cb(err);
            }
            // All links are now cleaned-up, we can remove the comic's
            // remaining artifact.
            return this._data.remove(comicKey, err => {
                return cb(err);
            });
        });
    });
};
