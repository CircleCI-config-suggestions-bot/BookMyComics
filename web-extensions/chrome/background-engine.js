const BACKGROUND_ID = 'BookMyComics/BackgroundScript'

const bmcSources = new BmcSources();
console.log('BookMyComics: background-script.js: Instanciated BmcSources');

const bmcMessaging = new BmcMessagingHandler();
console.log('BookMyComics: background-script.js: Instanciated BmcMessagingHandler');

bmcMessaging.addWindowHandler(
    BACKGROUND_ID,
    evData => evData.type === 'computation'
              && evData.module === 'sources'
              && evData.computation === 'URL:Parse:Request',
    (evData, sender, sendResponse) => {
        console.log(`BookMyComics: background-engine.js: Handling URL:Parse Request: ${evData}`);
        let info = bmcSources.parseURL(evData.resource.origin, evData.resource.path);
        const answerEv = {
            type: 'computation',
            module: 'sources',
            computation: 'URL:Parse:Response',
            resource: {
                origin: evData.resource.origin,
                path: evData.resource.path,
                comic: bmcSources.parseURL(evData.resource.origin,
                                           evData.resource.path),
            }
        };
        return sendResponse(answerEv);
    });

bmcMessaging.addWindowHandler(
    BACKGROUND_ID,
    evData => evData.type === 'computation'
              && evData.module === 'sources'
              && evData.computation === 'URL:Generate:Request',
    (evData, sender, sendResponse) => {
        console.log(`BookMyComics: background-engine.js: Handling URL:Generate Request: ${evData}`);
        const answerEv = {
            type: 'computation',
            module: 'sources',
            computation: 'URL:Generate:Response',
            resource: {
                url: bmcSources.computeURL(evData.resource.reader,
                                           evData.resource.comic,
                                           evData.resource.chapter,
                                           evData.resource.page),
            }
        };
        return sendResponse(answerEv);
    });
