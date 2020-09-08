/* globals
    compat:readable
    getBrowser:readable
*/

/**
 * This class is a very simple wrapper on top of the various browser's APIs for
 * storage, made to unify them into a simpler-to-user API.
 * It thus handles transparently both standard callback-based asynchronous
 * calls, as well as promises.
 *
 * @class BmcStorage
 */
function BmcStorage() {
    var bro = getBrowser();
    this._area = bro.storage.sync;
    if (!this._area) {
        this._area = bro.storage.local;
    }
}

BmcStorage.prototype._handleCb = function(cb, err, data) {
    if (err && (typeof err !== 'object' || Object.keys(err).length > 0)) {
        return cb(err);
    }
    return cb(null, data);
};

/**
 * This function provides a unified API to get from the storage layers of the
 * browser.
 *
 * @param {String[]|String} keys - Single key or array of keys to retrieve the
 *                                 data of
 * @param {CompatibilityLayer~storageGetCb} cb
 *
 * @return {undefined}
 */
BmcStorage.prototype.get = function(keys, cb) {
    return compat.storage.get(
        this._area,
        keys,
        (err, data) => this._handleCb(cb, err, data)
    );
};

/**
 * This function provides a unified API to write data into the storage layers
 * of the browser.
 *
 * @param {Object} dataset - Dictionary of the key/values to store
 * @param {CompatibilityLayer~storageSetCb} cb
 *
 * @return {undefined}
 */
BmcStorage.prototype.set = function(dataset, cb) {
    return compat.storage.set(
        this._area,
        dataset,
        err => this._handleCb(cb, err)
    );
};

/**
 * This function provides a unified API to remove data from the storage layers
 * of the browser.
 *
 * @param {String[]|String} keys - Single key or array of keys to be removed
 *                                 from the storage
 * @param {CompatibilityLayer~storageRemoveCb} cb
 *
 * @return {undefined}
 */
BmcStorage.prototype.remove = function(keys, cb) {
    return compat.storage.remove(
        this._area,
        keys,
        err => this._handleCb(cb, err)
    );
};

/**
 * This function provides a unified API to delete all data saved by the
 * extension from the storage of the browser.
 *
 * @param {CompatibilityLayer~storageClearCb} cb
 *
 * @return {undefined}
 */
BmcStorage.prototype.clear = function(cb) {
    return compat.storage.clear(
        this._area,
        err => this._handleCb(cb, err)
    );
};
