/* globals
    compat:readable
    getBrowser:readable
 */

function BmcSettings() {
    this._dict = {};
}

BmcSettings.KEY = 'BookMyComics.settings';
BmcSettings.keys = [
    'storage-engine',  // str
];

/**
 * This method updates the settings of the web-extension in a persistent manner.
 * Note that for ease of use, the function may return before the setting is
 * persisted, due to the asynchronous nature of the browser's storage.
 *
 * @method
 *
 * @param {String} key - The key of the setting to persist
 * @param {String} value - the Value of the setting to persist
 * @param {BmcSettings~setCb|undefined} cb - the optional completion CB
 *
 * @return {undefined}
 */
BmcSettings.prototype.set = function(key, value, cb) {
    this._dict[key] = value;
    const dataset = {};
    dataset[BmcSettings.KEY] = this._dict;
    compat.storage.set(getBrowser().storage.local, dataset, (err) => {
        if (err) {
            // TODO Log the persistence error ?
            if (cb)
                cb(err);
        }
        if (cb)
            cb(null);
    });
};

/**
 * This method retrieves the Setting object's local copy of the requested
 * setting. This is designed in order to reduce the need for asynchronous
 * operations when interrogating settings.
 *
 * @method
 *
 * @param {String} key - The key of the setting to persist
 *
 * @return {String|undefined} the associated setting value
 */
BmcSettings.prototype.get = function(key) {

    if (!Object.prototype.hasOwnProperty.call(this._dict, key))
        return undefined;
    return this._dict[key];
};

/**
 * This method retrieves persistently storage settings to overwrite its own.
 * This can be used to ensure synchronization between various components/pages
 * of the web-extension.
 *
 * @method
 *
 * @param {BmcSettings~refreshCb} cb - The completion callback
 *
 * @return {undefined}
 */
BmcSettings.prototype.refresh = function(cb) {
    compat.storage.get(getBrowser().storage.local, [BmcSettings.KEY], (err, data) => {
        if (err) {
            cb(err);
            return ;
        }
        this._dict = data[BmcSettings.KEY] || {};  // Ensure it's always at least an empty dict
        cb(null);
    });
};
