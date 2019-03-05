/* eslint-disable-next-line no-undef */
module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [ 'mocha' ],
        files: [
            // Testing dependencies
            'node_modules/sinon-chrome/bundle/sinon-chrome-webextensions.min.js',

            // Modules to test
            'web-extensions/chrome/strings.js',
            'web-extensions/chrome/utils.js',
            'web-extensions/chrome/engine/storage.js',

            // Test files
            'tests/unit/*.js'
        ],
        browsers: ['ChromeHeadless', 'FirefoxHeadless'],
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: [ '-headless' ],
            }
        }
    });
};
