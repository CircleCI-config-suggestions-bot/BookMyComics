/* globals
    compat:readable
*/

/**
 * This class is a very simple wrapper on top of the various browser's APIs for
 * storage, made to unify them into a simpler-to-user API.
 * It thus handles transparently both standard callback-based asynchronous
 * calls, as well as promises.
 *
 * @class BmcKeyValueStorage
 */
function BmcKeyValueStorage() {
    this._engine = null;
}

BmcKeyValueStorage.prototype._handleCb = function(cb, err, data) {
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
BmcKeyValueStorage.prototype.get = function(keys, cb) {
    return compat.storage.get(
        this._engine,
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
BmcKeyValueStorage.prototype.set = function(dataset, cb) {
    return compat.storage.set(
        this._engine,
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
BmcKeyValueStorage.prototype.remove = function(keys, cb) {
    return compat.storage.remove(
        this._engine,
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
BmcKeyValueStorage.prototype.clear = function(cb) {
    return compat.storage.clear(
        this._engine,
        err => this._handleCb(cb, err)
    );
};
