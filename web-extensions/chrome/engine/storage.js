/* globals
    getBrowser:readable
    LOGS:readable
*/

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
     *
     * NOTE It seems that chrome throws a ReferenceError when accessing the
     * undefined variable, while Firefox allows it. let's try/catch around it
     * for safety.
     */
    try {
        if (browser !== undefined) {
            this._mode = this.MODE_PROMISE;
        }
    } catch (e) {
        if (e.name === 'ReferenceError') {
            // Keep Callback mode
        }
    }
    LOGS.log('S30', {'mode': this._mode});
}

Storage.prototype.MODE_CALLBACK = 0;
Storage.prototype.MODE_PROMISE = 1;

Storage.checkErr = function(err) {
    return err && (typeof err !== 'object' || Object.keys(err).length > 0);
};


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
    function resolveCb(data, err) {
        if (Storage.checkErr(err)) {
            return onError(err);
        }
        return onSuccess(data);
    }

    let allArgs = [];
    allArgs.push(args);

    switch(this._mode) {
    case this.MODE_PROMISE:
        return funcObj(args).catch(onError).then(onSuccess);
    case this.MODE_CALLBACK:
    default:
        allArgs.push(resolveCb);
        return funcObj(args, resolveCb);
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
    function onError(err) {
        return cb(err);
    }
    function onSuccess(data) {
        return cb(null, data);
    }
    return this._cbify(this._area.get, keys, onSuccess, onError);
};

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
    function onError(err) {
        if (cb) {
            return cb(err);
        }
    }
    function onSuccess() {
        if (cb) {
            return cb(null);
        }
    }
    return this._cbify(this._area.set, dataset, onSuccess, onError);
};

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
    function onError(err) {
        return cb(err);
    }
    function onSuccess() {
        return cb(null);
    }
    return this._cbify(this._area.remove, keys, onSuccess, onError);
};

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
    function onError(err) {
        return cb(err);
    }
    function onSuccess() {
        return cb(null);
    }
    return this._cbify(this._area.clear, onSuccess, onError);
};
