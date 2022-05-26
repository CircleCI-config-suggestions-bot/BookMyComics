/* eslint-disable-next-line no-unused-vars */
function getBrowser() {
    return chrome || window.chrome || browser || window.browser;
}

/* eslint-disable-next-line no-unused-vars */
function cloneArray(arr) {
    // The "Array.prototype.slice.call" call is to prevent chrome very bad handling of DOM
    // iteration.
    return Array.prototype.slice.call(arr);
}


/*
 * Credit for these function goes to
 * https://gomakethings.com/converting-a-string-into-markup-with-vanilla-js/
 *
 * Thanks for providing us with a reliable method to load HTML from text data.
 *
 */
//
const supports_DOMParser = (function () {
    if (!window.DOMParser)
        return false;
    var parser = new DOMParser();
    try {
        parser.parseFromString('x', 'text/html');
    } catch(err) {
        return false;
    }
    return true;
})();

/* eslint-disable-next-line no-unused-vars */
function stringToHTML(str) {

    // If DOMParser is supported, use it
    if (supports_DOMParser) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body;
    }

    // Otherwise, fallback to old-school method
    var dom = document.createElement('div');
    dom.innerHTML = str;
    return dom;
}
