/* globals
    BmcComic:readable
    BmcComicSource:readable
    BmcDataAPI: readable
    BmcMessagingHandler:readable
    BmcSources:readable
    compat:readable
    LOGS:readable
*/

/*
 * /!\  IMPORTANT - PLEASE READ  /!\
 *
 * There are many reasons in this web-extension for the existence of the
 * "background" or "extension" page (which uses this script as an entry-point).
 *
 * First of all, many contraints are pushed onto the web-extension development
 * by various security features of the browsers:
 *  - CORS (Cross Origin Resource Sharing) prevents any piece of code from
 *  calling specific APIs or loading URLs that are not authorized beforehands
 *  by the website's developer. This makes the job of a web-extension more
 *  complex, as many thing are now authorized depending on the context.
 *  - Permission specification (manifest) & limitations based on the context of
 *  the script
 *
 * This has many implications including:
 * - Sidebar (frame loading the extension's URL) has no right to inspect the
 *   parent frame's DOM
 * - Sidebar (frame loading the extension's URL) cannot interact with browser
 *   storage
 *
 * Also, in a concern to keep the manifest duplication as small as possible for
 * each of the readers supported, we've chosen to:
 * - Avoid loading all reader support scripts into all pages
 *
 * All these constraints (most of which are enforced by the browser) led us to
 * increasingly consider the extension page as a central HUB for messaging, and
 * interacting with the storage implementation, explaining why:
 *  - All reader support scripts are loaded into the extension page
 *  - The extension script is mostly about handling messages and computing
 *    stuff on behalf of other scripts.
 *  - A lot of apparently simple logics have become a multi-step process of
 *    message exchanges and computations
 */

const BACKGROUND_ID = 'BookMyComics/BackgroundScript';

const bmcSources = new BmcSources();
LOGS.log('S66');

const bmcData = new BmcDataAPI();

const bmcMessaging = new BmcMessagingHandler();
LOGS.log('S67');

bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'computation'
              && evData.module === 'sources'
              && evData.computation === 'URL:Generate:Request',
    evData => {
        LOGS.log('S68', {'evData': JSON.stringify(evData)});
        return sendResponse => {
            bmcData.getComic(evData.resource.id, (err, comic) => {
                let answerEv = {
                    type: 'computation',
                    module: 'sources',
                    computation: 'URL:Generate:Response',
                    resource: {
                        err: false,
                        url: null,
                    },
                };
                if (err) {
                    answerEv.err = LOGS.getString('S1');
                    return sendResponse(answerEv);
                }
                answerEv.resource.url = bmcSources.computeURL(evData.resource.reader, comic);
                if (!answerEv.resource.url) {
                    answerEv.err = LOGS.getString('S40', {'comic': comic});
                    return sendResponse(answerEv);
                }
                return sendResponse(answerEv);
            });
        };
    }
);

function sendNotificationWithComicInfo(operation, comic, source, err) {
    var evData = {
        type: 'action',
        action: 'notification',
        operation: operation,
        error: (err||{}).message,
        comic: comic.serialize(),
        source: source ? source.toDict() : null,
    };
    compat.sendMessage(evData, () => {});
}

// Handle "Register"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'register',
    evData => {
        const comic = BmcComic.deserialize(evData.comic);
        comic.label = evData.label;
        const source = BmcComicSource.fromDict(evData.source);
        register(
            evData.label,
            comic,
            source,
            (err, id) => {
                let retErr = null;
                if (err) {
                    retErr = new Error(
                        LOGS.getString('E0010', {
                            'label': evData.label,
                            'err': err.message,
                        })
                    );
                }
                evData.comic.id = id;
                sendNotificationWithComicInfo('Register Comic', comic, source, retErr);
            });
    }
);
// Handle "Alias"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'alias',
    evData => {
        const comic = BmcComic.deserialize(evData.comic);
        const source = BmcComicSource.fromDict(evData.source);
        alias(
            comic,
            source,
            err => {
                let retErr = null;
                if (err) {
                    retErr = new Error(LOGS.getString('E0011', {
                        'id': evData.comic.id,
                        'err': err.message
                    }));
                }
                sendNotificationWithComicInfo('Alias Comic', comic, source, retErr);
            });
    }
);
// Handle "Delete"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'delete',
    evData => {
        const comic = BmcComic.deserialize(evData.comic);
        const source = evData.source ? BmcComicSource.fromDict(evData.source) : null;
        deleteSourceOrComic(
            comic,
            source,
            err => {
                let retErr = null;
                if (err) {
                    retErr = new Error(LOGS.getString('E0017', {
                        kind: evData.source ? 'Source' : 'Comic',
                        reason: err.message,
                    }));
                }
                const kind = evData.source ? 'Comic Source' : 'Comic';
                sendNotificationWithComicInfo(`Delete ${kind}`, comic, source, retErr);
            });
    }
);


/*
 * This function registers a comic into the saved data. It shall be used by the
 * user-interacting UI spawned on an online reader's page.
 *
 * @param {String} label - the Comic's user-defined label
 * @param {BmcComic} comic - the Comic's object
 * @param {BmcComicSource} source - the Source object for the comic
 *
 * @return {undefined}
 */
function register(label, comic, source, cb) {
    LOGS.log('S10', {'common': {label: label, chapter: comic.chapter, page: comic.page},
                     'source': JSON.stringify(source)});
    return bmcData.registerComic(label, comic, source, (err, id) => {
        LOGS.debug('S11', {'err': err});
        return cb(err, id);
    });
}

/*
 * This function registers a new name for an existing comic into the saved data.
 * Then, it also updates the progress of reading for this comic.
 *
 * @param {BmcComic} comic - the Comic's object
 * @param {BmcComicSource} source - the Source object for the comic
 *
 * @return {undefined}
 */
function alias(comic, source, cb) {
    LOGS.log('S12', {'comicId': comic.id,
                     'label': comic.label,
                     'source': JSON.stringify(source)});
    return bmcData.aliasComic(comic.id, source, err => {
        return cb(err);
    });
}

/*
 * This function deletes a Source from a comic or a whole Comic, given a comic
 * ID, and an optional reader and name.  If the deleted source was the last
 * source associated to the Comic, the Comic will be deleted along with its
 * last Source.
 *
 * @param {Number} comicId - Unique comic ID
 * @param {BmcComicSource} source - the Source object for the comic
 *
 * @return {undefined}
 */
function deleteSourceOrComic(comic, source, cb) {
    LOGS.debug('S60', { id: comic.id, source: JSON.stringify(source) });

    // Both reader and name must be defined to identify a source according to
    // engine/datamodel.js
    // As such, if either is undefined, assume we're targeting the whole comic
    if (!source) {
        return bmcData.unregisterComic(comic.id, cb);
    }
    // Otherwise, remove the source (and optionally the Comic if it was the
    // last source)
    return bmcData.unaliasComic(comic.id, source, cb);
}
