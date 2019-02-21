/*
 * Don't do anything if we're not in the root window.
 *
 * This helps preventing a bug that we've observed in the path: Recursive
 * loading of the webextension in situations where the page included an iframe
 * which resource seemed to somehow match the supported website's domain.
 */
if (window.top === window) {
    /*
     * NOTE:
     * We do not setup the engine first, in a concern of simplicity of the code
     * (this avoids the requirement of a reconfigurable object).
     *
     * First, request the actual URL's manga information from the background page
     * (who has the permissionss to load all supported origin scripts).
     */
    const ev = {
        type: 'computation',
        module: 'sources',
        computation: 'URL:Parse:Request',
        resource: {
            origin: window.location.origin,
            path: window.location.pathname,
        },
    };
    LOGS.log('S39');
    // Now send the message to the background page
    getBrowser().runtime.sendMessage(ev, (response, err) => {
        if (err) {
            LOGS.warn('E0002', {'err': err});
            return undefined;
        }
        LOGS.log('S41', {'data': JSON.stringify(response)});
        /*
         * And finally, we can instanciate the engine and let it spawn the UI:
         *
         * NOTE: We're defaulting "response.resource.comic" here in case it
         * could be undefined. This would mean that we're not on a manga
         * page, but browsing the reader's website.
         */
        const engine = new BmcEngine(window.location.origin,
                                     window.location.hostname,
                                     response.resource.comic);
        LOGS.log('S42');
        engine.setup();
    });
} else {
    LOGS.warn('E0003', {'location': window.location});
}
