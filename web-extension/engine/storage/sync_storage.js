/* globals
    getBrowser:readable
    BmcKeyValueStorage:readable
*/

function SyncStorageEngine() {
    this._engine = getBrowser().storage.sync;
}

// Inherit from BmcKeyValueStorage
SyncStorageEngine.prototype = new BmcKeyValueStorage();
SyncStorageEngine.prototype.constructor = SyncStorageEngine;

SyncStorageEngine.name = 'SyncStorage';
SyncStorageEngine.available = (getBrowser().storage.sync != undefined);
