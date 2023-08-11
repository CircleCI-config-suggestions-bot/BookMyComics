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


BmcStorageFactory.new = function(name) {
    let engine = null;

    // Apply default
    if (name === null) {
        // TODO: Get saved settings
        // name = BmcSettings.get('storage');

        // fallback: guess current default
        if (SyncStorageEngine.available === false) {
            engine = new LocalStorageEngine();
        } else {
            engine = new SyncStorageEngine();
        }
        return engine;
    }

    for (let i = 0; i < BmcStorageFactory.engines.length; ++i) {
        if (name === BmcStorageFactory.engines[i].name) {
            engine = new BmcStorageFactory.engines[i]();
            break;
        }
    }
    return engine;
};

BmcStorageFactory.engines = [
    LocalStorageEngine,
    SyncStorageEngine,
];
