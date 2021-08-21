/* globals
    BmcDataAPI: readable
    BmcMessagingHandler:readable
    BmcSources:readable
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
