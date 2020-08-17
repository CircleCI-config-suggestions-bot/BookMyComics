/* globals
    BmcEngine:readable
    BmcSources:readable
    LOGS:readable
*/

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
    LOGS.log('S39');

    try {
        var sources = new BmcSources();
        var comic = sources.getInfos(window.location.host, window.location.pathname, document.body);
        // Log about comic info retrieval
        if (comic) {
            LOGS.log('S41', {'data': JSON.stringify(comic)});
        } else {
            LOGS.error('E0022');
        }
        /*
         * Now, we can instanciate the engine and let it spawn the UI:
         *
         * NOTE: Wether we got a comicInfo or not should not prevent spawning
         * the Engine & UI, as the sidepanel should appear whenever the user
         * loads a supported website's page. The underlying BmcEngine
         * constructor defaults `comic` if null.
         */
        const engine = new BmcEngine(window.location.origin, window.location.hostname, comic /* may be null */);
        engine.setup();
        LOGS.log('S42');
    } catch (err) {
        LOGS.error('E0023', {'error': err});
    }
} else {
    LOGS.warn('E0003', {'iframe': window.location});
}
