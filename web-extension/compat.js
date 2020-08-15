/* globals
    getBrowser:readable
    LOGS:readable
*/

/**
 * This class provides the compatibility layer for the Storage API
 *
 * @class StorageCompatibilityLayer
 */
function StorageCompatibilityLayer(mode) {
    this._mode = mode;
}

StorageCompatibilityLayer.prototype.MODE_CALLBACK = CompatibilityLayer.prototype.MODE_CALLBACK;
StorageCompatibilityLayer.prototype.MODE_PROMISE = CompatibilityLayer.prototype.MODE_PROMISE;

/**
 * @callback StorageCompatibilityLayer~getCb
 * @param {Error} err - Error object returned by the failing layer
 * @param {Object} data - Object containing the retrieved data
 */
/**
 * This function provides a unified API to send a Message between background
 * page and loaded pieces of BookMyComics.
 *
 * @param {StorageArea} instance - The storage Area instance to use
 * @param {String[]|String} keys - Single key or array of keys to retrieve the
 *                                 data of
 * @param {StorageCompatibilityLayer~getCb} cb
 *
 * @return {undefined}
 */
StorageCompatibilityLayer.prototype.get = function(instance, keys, cb) {
    switch(this._mode) {
    case this.MODE_PROMISE:
        return instance.get(keys)
            .catch(err => cb(err))
            .then(data => cb(null, data));
    case this.MODE_CALLBACK:
    default:
        // Chrome provides no error handling facility for Storage.get...
        return instance.get(keys, data => cb(null, data));
    }
};

/**
 * @callback StorageCompatibilityLayer~setCb
 * @param {Error} err - Error object returned by the failing layer
 */
/**
 * This function provides a unified API to write data into the storage layers
 * of the browser.
 *
 * @param {StorageArea} instance - The storage Area instance to use
 * @param {Object} dataset - Dictionary of the key/values
 *                           to store
 * @param {StorageCompatibilityLayer~setCb} cb
 *
 * @return {undefined}
 */
StorageCompatibilityLayer.prototype.set = function(instance, dataset, cb) {
    switch(this._mode) {
    case this.MODE_PROMISE:
        return instance.set(dataset)
            .catch(err => cb(err))
            .then(() => cb(null));
    case this.MODE_CALLBACK:
    default:
        return instance.set(dataset, cb);
    }
};


/**
 * @callback StorageCompatibilityLayer~removeCb
 * @param {Error} err - Error object returned by the failing layer
 */
/**
 * This function provides a unified API to remove data from the storage layers
 * of the browser.
 *
 * @param {StorageArea} instance - The storage Area instance to use
 * @param {String[]|String} keys - Single key or array of keys to be removed
 *                                 from the storage
 * @param {StorageCompatibilityLayer~removeCb} cb
 *
 * @return {undefined}
 */
StorageCompatibilityLayer.prototype.remove = function(instance, keys, cb) {
    switch(this._mode) {
    case this.MODE_PROMISE:
        return instance.remove(keys)
            .catch(err => cb(err))
            .then(() => cb(null));
    case this.MODE_CALLBACK:
    default:
        return instance.remove(keys, cb);
    }
};

/**
 * @callback StorageCompatibilityLayer~clearCb
 * @param {Error} err - Error object returned by the failing layer
 */

/**
 * This function provides a unified API to delete all data saved by the
 * extension from the storage of the browser.
 *
 * @param {StorageArea} instance - The storage Area instance to use
 * @param {StorageCompatibilityLayer~clearCb} cb
 *
 * @return {undefined}
 */
StorageCompatibilityLayer.prototype.clear = function(instance, cb) {
    switch(this._mode) {
    case this.MODE_PROMISE:
        return instance.clear()
            .catch(err => cb(err))
            .then(() => cb(null));
    case this.MODE_CALLBACK:
    default:
        return instance.clear(cb);
    }
};

/**
 * This class is used as a single-instance compatibility layer, which provides
 * an abstraction over the various browsers callbacks/promises handling of
 * asynchronous calls.
 *
 * @class CompatibilityLayer
 */
function CompatibilityLayer() {
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

    this.storage = new StorageCompatibilityLayer(this._mode);
}

CompatibilityLayer.prototype.MODE_CALLBACK = 0;
CompatibilityLayer.prototype.MODE_PROMISE = 1;

/**
 * @callback CompatibilityLayer~sendMessageCb
 * @param {Object} response - Response object returned by the handler of the
 *                            message sent
 */
/**
 * This function provides a unified API to send a Message between background
 * page and loaded pieces of BookMyComics.
 *
 * @param {Object} ev - The event data to send
 * @param {CompatibilityLayer~sendMessageCb} cb
 *
 * @return undefined
 */
CompatibilityLayer.prototype.sendMessage = function(ev, cb) {
    let bro = getBrowser();
    switch(this._mode) {
    case this.MODE_PROMISE:
        return bro.runtime.sendMessage(ev)
            .catch(err => cb(err))
            .then(response => cb(null, response));
    case this.MODE_CALLBACK:
    default:
        return bro.runtime.sendMessage(ev, response => cb(null, response));
    }
};

/**
 * This function provides a unified API to send a Message between background
 * page and loaded pieces of BookMyComics.
 *
 * @param {Function} sendResponse - function object provided to the callback of
 *                                  the sendMessage API
 * @param {Object} data - The event data to send
 *
 * @return undefined
 */
CompatibilityLayer.prototype.sendResponse = function(sendResponse, data) {
    switch(this._mode) {
    case this.MODE_PROMISE:
        return Promise.resolve(data);
    case this.MODE_CALLBACK:
    default:
        sendResponse(data);
        return false;
    }
};

/* eslint-disable-next-line no-unused-vars */
var compat = new CompatibilityLayer();
