/*
 * Don't do anything if we're not in the root window.
 *
 * This helps preventing a bug that we've observed in the path: Recursive
 * loading of the webextension in situations where the page included an iframe
 * which resource seemed to somehow match the supported website's domain.
 */
if (window.top === window) {
    const work = readerURLParse();

    /*
     * Now, let the engine do its magic: Register, track, etc.
     *
     * NOTE: We're defaulting "work" here in case it could be undefined.
     * This would mean that we're not on a manga page, but browsing the
     * reader's website.
     *
     * This should still allow the webextension to spawn its sidebar, hence
     * this work-around of the undefined `work` object, to only provide
     * undefined values instead of the parameters.
     */
    const engine = new BmcEngine(window.location.hostname,
                                 (work || {}).manga,
                                 (work || {}).chapter,
                                 (work || {}).page);
    console.log('Instanciated BmcEngine');
    engine.setup();
} else {
    console.warn(`Attempting to reload for iframe: ${window.location}`);
}
