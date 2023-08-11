/* globals
    LocalStorageEngine:readable
    SyncStorageEngine:readable
*/

/**
 * This class is a very simple Factory, able to instanciate any storage engine,
 * according to the provided engine name.
 *
 * It is also able to provide the classes (and thus the static member names) of
 * the supported engines.
 *
 * @class BmcStorageFactory
 */
function BmcStorageFactory() {
}


/**
 * Internal method which defines what Storage engine to use, when none is
 * provided otherwise.
 *
 * @returns {String} the name of the Storage engine that should be used
 */
BmcStorageFactory.default = function() {
    let dflt = null;

    // TODO: Get saved settings
    // dflt = BmcSettings.get('storage');

    dflt = LocalStorageEngine.engine_name;
    if (SyncStorageEngine.available === true) {
        dflt = SyncStorageEngine.engine_name;
    }

    return dflt;
};


/**
 * This method instanciates a new Storage engine according to the provided
 * input `in_name`. To let the saved settings and/or default mechanism choose
 * the right engine, the `in_name` parameter should be set to `null`.
 *
 * @param {String} in_name - The name of the storage engine to use (and
 *                           generate an object of)
 *
 * @return {null|BmcKeyValueStorage} The Storage engine object to be used for
 *                                   all storage-related operations
 */
BmcStorageFactory.new = function(in_name) {
    let name = in_name;
    let engine = null;

    // Apply default
    if (name === undefined || name === null) {
        name = BmcStorageFactory.default();
    }

    for (let i = 0; i < BmcStorageFactory.engines.length; ++i) {
        if (name === BmcStorageFactory.engines[i].engine_name) {
            engine = new BmcStorageFactory.engines[i]();
            break;
        }
    }
    // TODO Log about inability to find a storage engine
    return engine;
};

BmcStorageFactory.engines = [
    LocalStorageEngine,
    SyncStorageEngine,
];
