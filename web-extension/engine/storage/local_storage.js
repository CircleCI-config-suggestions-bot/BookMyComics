/* globals
    getBrowser:readable
    BmcKeyValueStorage:readable
*/
function LocalStorageEngine() {
    this._engine = getBrowser().storage.local;
}

// Inherit from BmcKeyValueStorage
LocalStorageEngine.prototype = new BmcKeyValueStorage();
LocalStorageEngine.prototype.constructor = LocalStorageEngine;

LocalStorageEngine.engine_name = 'LocalStorage';
LocalStorageEngine.available = true; // Always available
