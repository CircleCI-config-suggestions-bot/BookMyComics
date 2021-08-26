/* globals
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
        LOGS.log('S68', {'evData' :evData});
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
                const comicInfo = comic.toInfo(evData.resource.reader);
                answerEv.resource.url = bmcSources.computeURL(evData.resource.reader, comicInfo);
                if (!answerEv.resource.url) {
                    answerEv.err = LOGS.getString('S40', {'comicInfo': comicInfo});
                    return sendResponse(answerEv);
                }
                return sendResponse(answerEv);
            });
        };
    }
);

function sendNotificationWithComicInfo(operation, comic, err) {
    var evData = {
        type: 'action',
        action: 'notification',
        operation: operation,
        error: (err||{}).message,
        comic: {
            id: comic.id,
            reader: comic.reader,
            name: comic.name,
            chapter: comic.chapter,
            page: comic.page,
        },
    };
    compat.sendMessage(evData, () => {});
}

// Handle "Register"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'register',
    evData => {
        register(evData.label, evData.comic, (err, id) => {
            let retErr = null;
            if (err) {
                retErr = new Error(
                    LOGS.getString(
                        'E0010',
                        {
                            'label': evData.label,
                            'err': err.message,
                        }
                    )
                );
            }
            evData.comic.id = id;
            sendNotificationWithComicInfo('Register Comic', evData.comic, retErr);
        });
    }
);
// Handle "Alias"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'alias',
    evData => {
        alias(evData.comic, err => {
            let retErr = null;
            if (err) {
                retErr = new Error(LOGS.getString(
                    'E0011',
                    {'id': evData.comic.id, 'err': err.message}
                ));
            }
            sendNotificationWithComicInfo('Alias Comic', evData.comic, retErr);
        });
    }
);
// Handle "Delete"
bmcMessaging.addExtensionHandler(
    BACKGROUND_ID,
    evData => evData.type === 'action' && evData.action === 'delete',
    evData => {
        deleteSourceOrComic(
            evData.comic,
            (evData.source || {}).reader,
            (evData.source || {}).name,
            err => {
                let retErr = null;
                if (err) {
                    retErr = new Error(LOGS.getString('E0017', {
                        kind: evData.source ? 'Source' : 'Comic',
                        reason: err.message,
                    }));
                }
                const kind = evData.source ? 'Comic Source' : 'Comic';
                sendNotificationWithComicInfo(`Delete ${kind}`, evData.comic, retErr);
            });
    }
);


/*
 * This function registers a comic into the saved data. It shall be used by the
 * user-interacting UI spawned on an online reader's page.
 *
 * @param {String} label - the Comic's user-defined label
 *
 * @return {undefined}
 */
function register(label, comic, cb) {
    LOGS.log('S10', {'label': label,
                     'reader': comic.reader,
                     'manga': comic.name,
                     'chapter': comic.chapter,
                     'page': comic.page});
    return bmcData.registerComic(label, comic.reader, comic, (err, id) => {
        LOGS.debug('S11', {'err': err});
        return cb(err, id);
    });
}

/*
 * This function registers a new name for an existing comic into the saved data.
 * Then, it also updates the progress of reading for this comic.
 */
function alias(comic, cb) {
    LOGS.log('S12', {'comicId': comic.id,
                     'reader': comic.reader,
                     'manga': comic.name});
    return bmcData.aliasComic(comic.id, comic.reader, comic, err => {
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
 * @param {String} reader - Name of the source's reader
 * @param {String} name - Name of the comic within the reader
 *
 * @return {undefined}
 */
function deleteSourceOrComic(comic, reader, name, cb) {
    LOGS.debug('S60', { id: comic.id, reader, name });

    // Both reader and name must be defined to identify a source according to
    // engine/datamodel.js
    // As such, if either is undefined, assume we're targeting the whole comic
    if (!reader || !name) {
        return bmcData.unregisterComic(comic.id, cb);
    }
    // Otherwise, remove the source (and optionally the Comic if it was the
    // last source)
    return bmcData.unaliasComic(comic.id, reader, name, cb);
}
