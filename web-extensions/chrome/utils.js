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
