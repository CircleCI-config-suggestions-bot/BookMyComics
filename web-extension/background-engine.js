/* globals
    BmcDataAPI: readable
    BmcMessagingHandler:readable
    BmcSources:readable
    LOGS:readable
*/

const BACKGROUND_ID = 'BookMyComics/BackgroundScript';

const bmcSources = new BmcSources();
LOGS.log('S66');

const bmcMessaging = new BmcMessagingHandler();
LOGS.log('S67');

bmcMessaging.addWindowHandler(
    BACKGROUND_ID,
    evData => evData.type === 'computation'
              && evData.module === 'sources'
              && evData.computation === 'URL:Generate:Request',
    evData => { // Don't receive `sender`, as we don't use it.
        LOGS.log('S68', {'evData' :evData});
        const answerEv = {
            type: 'computation',
            module: 'sources',
            computation: 'URL:Generate:Response',
            resource: {
                reader: evData.resource.reader,
                comic: evData.resource.comic,
                url: bmcSources.computeURL(evData.resource.reader,
                                           evData.resource.comic),
            }
        };
        return answerEv;
    }
);
