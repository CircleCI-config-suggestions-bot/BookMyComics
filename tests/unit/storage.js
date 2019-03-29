/* globals
    after:readable
    before:readable
    beforeEach:readable
    describe:readable
    global:writeable
    it:readable
    require:readable
*/

const assert = require('assert');
const chrome = require('sinon-chrome/extensions');

describe('storage.js', () => {
    before(() => {
        global.chrome = chrome;
    });

    beforeEach(() => {
        chrome.flush();
    });

    after(() => {
        chrome.flush();
        delete global.chrome;
    });

    it('instanciate', done => {
        const syncStub = {};
        chrome.storage.sync = syncStub;
        const store = new Storage();
        assert.strictEqual(store._area, syncStub);
        return done();
    });

    it('get', done => {
        return done();
    });

    it('set', done => {
        return done();
    });

    it('remove', done => {
        return done();
    });

    it('clear', done => {
        return done();
    });
});
