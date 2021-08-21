/* globals
    compat:readable
    getBrowser:readable
    LOGS:readable
*/

/**
 * This global object is an array containing the various BmcMessageHandler
 * objects used by the window to handle its internal communication events.
 *
 * The reason why it's separate from `BmcExtensionHandlers` is that the API to
 * resolve both differs greatly:
 * - window message handling does not expect "answers" and thus requires no
 *   specific handling for asynchronous handlers.
 * - extension-wide messaging handling can be answered to, and by design, our
 *   web-extension may require to handle asynchronous handling to interact with
 *   various components before answering.
 *
 * This object should never be accessed directly, but accessed through a
 * BmcMessagingHandlers object.
 *
 * @global
 */
var BmcWindowHandlers = [];

/**
 * This global object is an array containing the various BmcMessageHandler
 * objects used by any piece of the web-extension to communicate globally with
 * other pieces of the web-extension. Note that this is mostly useful for
 * communications between a window and the background page.
 *
 * The reason why it's separate from `BmcWindowHandlers` is that the API to
 * resolve both differs greatly:
 * - window message handling does not expect "answers" and thus requires no
 *   specific handling for asynchronous handlers.
 * - extension-wide messaging handling can be answered to, and by design, our
 *   web-extension may require to handle asynchronous handling to interact with
 *   various components before answering.
 *
 * This object should never be accessed directly, but accessed through a
 * BmcMessagingHandlers object.
 *
 * @global
 */
var BmcExtensionHandlers = [];


/**
 * A function that tells whether an event should be handled by the associated
 * BmcMEssageHandler~HandlerFunction, by checking the event's object provided
 * as parameter.
 *
 * @callback BmcMessageHandler~SelectorFunction
 *
 * @params {Object} evData - The event's object
 *
 * @returns {undefined}
 */

/**
 * A function that handles an event by accepting the event's object as
 * parameter.
 *
 * @callback BmcMessageHandler~HandlerFunction
 *
 * @params {Object} evData - The event's object
 *
 * @returns {undefined}
 */

/**
 * This function is the constructor for the BmcMessageHandler class
 * This class is used as a wrapper to hold all informations regarding one
 * specific handler. A collection of these handlers can be found in the
 * `BmcWindowHandlers` global variable, and shall be manipulated through the
 * BmcMessagingHandler framework-class.
 *
 * @class
 *
 * @params {string} tag - a tag to identify a group of Handlers with for
 *                        grouped removal
 * @params {BmcMessageHandler~SelectorFunction} selector - a function to tell
 *                        whether the handler wants to be called for the
 *                        handled event.
 * @params {BmcMessageHandler~HandlerFunction} handler - the function to apply
 *                        to the event if the selector for this handler
 *                        returned truc
 */
function BmcMessageHandler(tag, selector, handler) {
    this.tag = tag;
    this.select = selector;
    this.handle = handler;
}

/**
 * This function is the constructor for the BmcMessagingHandler class
 * This class is used as a messaging framework, which stores its data globally
 * (through the `BmcWindowHanlders` variable).
 *
 * @class
 *
 * @params {string|undefined} topOrigin - if any, the origin of the topWindow,
 *            to allow accepting messages from it additionally to internal
 *            web-extension messages. This allows exchanging between host
 *            window and web-extension iframes.
 *
 */
function BmcMessagingHandler(topOrigin) {
    this._setup = false;
    this._topOrigin = topOrigin;
    this._selfOrigin = getBrowser().runtime.getURL('');
}

/*
 * This method makes use of internal object data in order to determine whether
 * a provided origin is accepted as the source of a message or not.
 */
BmcMessagingHandler.prototype._checkOrigin = function(origin) {
    if (this._selfOrigin.indexOf(origin) !== -1) {
        return true;
    }
    return this._topOrigin === origin;
};

/**
 * This function shall only be called once by the BmcMessagingHandler class.
 * It sets up one global eventHandler function for the 'message' events, and
 * handles various event Handlers through the BmcWindowHandlers variable and
 * its BmcMessageHandle objects.
 * This method allows a finer control over the Handlers managed by the
 * BmcMessagingHandlers class.
 *
 * @method
 */
BmcMessagingHandler.prototype.setupMessaging = function() {
    // Setup the cross-window (iframe actually) messaging to get notified when
    // the iframe will have spent its usefulness.
    window.addEventListener('message', event => {
        if (event.type === 'message') {
            if (event instanceof Error) {
                LOGS.log('S26',
                         {'data': JSON.stringify(event, ['message', 'arguments', 'type', 'name'])});
                return ;
            }

            /*
             * NOTE
             * Origin is actually shown as the extension's internal URL, so
             * let's retrieve it using runtime.getURL(''); and compare the
             * origin against it.
             * Note that the origin does not include an ending '/' while the
             * URL of the extension does, hence the 'indexOf' method rather
             * than a simple '===' comparison.
             */
            if (this._checkOrigin(event.origin)) {
                var eventData = event.data;
                if (typeof(eventData) !== 'object') {
                    LOGS.warn('E0008');
                    return ;
                }
                BmcWindowHandlers.forEach(handler => {
                    if (handler.select(eventData)) {
                        handler.handle(eventData);
                    }
                });
            }
        }
    });

    // Now, setup communication between background script & inserted frames:
    // `runtime.onMessage()` had a extension-wide range of messaging
    getBrowser().runtime.onMessage.addListener((event, sender, sendResponse) => {
        LOGS.log('S28', {'msg': JSON.stringify(event)});
        if (typeof(event) !== 'object') {
            LOGS.warn('E0004');
            return ;
        }
        let selected = BmcExtensionHandlers.filter(handler => handler.select(event));
        // Leave a trace if some handlers may not have been executed, for debugging
        if (selected.length < 1) {
            LOGS.error('E0000', {count: selected.length});
            sendResponse(null);
            return false;
        }
        if (selected.length > 1) {
            LOGS.warn('E0000', {count: selected.length});
        }
        // We only expect one response for this channel, so we only execute the
        // first handler found: Note: the proper return depending on async/sync
        // is ensured by `compat.extensionMessageWrapper()`.
        return selected[0].handle(event, sender, sendResponse);
    });
    this._setup = true;
};

/**
 * This function registers a handler in the messaging system according to the
 * provided handler settings.
 *
 * @method
 *
 * @params {string} tag - a tag to identify a group of Handlers with for
 *                        grouped removal
 * @params {BmcMessageHandler~SelectorFunction} selector - a function to tell
 *                        whether the handler wants to be called for the
 *                        handled event.
 * @params {BmcMessageHandler~HandlerFunction} handler - the function to apply
 *                        to the event if the selector for this handler
 *                        returned true
 */
BmcMessagingHandler.prototype.addWindowHandler = function(tag, selector, handler) {
    BmcWindowHandlers.push(new BmcMessageHandler(tag, selector, handler));
    if (this._setup === false) {
        this.setupMessaging();
    }
};


/**
 * This function removes all handlers which tag match the parameter provided.
 * It is useful to "unregister" a specific component (thus by removing all
 * related listeners, identified by a chosen tag).
 *
 * @method
 *
 * @params {string} tag - a name to identify the groups of handlers to be
 *                        removed from the messaging framework
 */
BmcMessagingHandler.prototype.removeWindowHandlers = function(tag) {
    BmcWindowHandlers = BmcWindowHandlers.filter(handler => handler.tag !== tag);
};


/**
 * This function registers a handler in the messaging system according to the
 * provided handler settings.
 *
 * @method
 *
 * @params {string} tag - a tag to identify a group of Handlers with for
 *                        grouped removal
 * @params {BmcMessageHandler~SelectorFunction} selector - a function to tell
 *                        whether the handler wants to be called for the
 *                        handled event.
 * @params {BmcMessageHandler~HandlerFunction} handler - the function to apply
 *                        to the event if the selector for this handler
 *                        returned true
 */
BmcMessagingHandler.prototype.addExtensionHandler = function(tag, selector, handler) {
    BmcExtensionHandlers.push(new BmcMessageHandler(tag, selector, compat.extensionMessageWrapper(handler)));
    if (this._setup === false) {
        this.setupMessaging();
    }
};


/**
 * This function removes all handlers which tag match the parameter provided.
 * It is useful to "unregister" a specific component (thus by removing all
 * related listeners, identified by a chosen tag).
 *
 * @method
 *
 * @params {string} tag - a name to identify the groups of handlers to be
 *                        removed from the messaging framework
 */
BmcMessagingHandler.prototype.removeExtensionHandlers = function(tag) {
    BmcExtensionHandlers = BmcExtensionHandlers.filter(handler => handler.tag !== tag);
};
