/* globals
    getBrowser:readable
    LOGS:readable
*/

/**
 * A function that tells whether an event/message should be handled by the
 * BaseMessagingHandler logic, based on various properties.
 * If the message should be handled, the function should return a sanitized
 * object, which can be directly fed to BmcMessageHandler~SelectorFunction and
 * BmcMessageHandler~HandlerFunction
 *
 * @callback BaseMessagingHandler~SanitizerFunction
 *
 * @params {Object} message - The message to check and sanitize
 *
 * @returns {object|null} - The sanitized event's data in case of success, nul
 *                          otherwise
 */

/**
 * A function that tells whether an event/message should be handled by the
 * associated BmcMEssageHandler~HandlerFunction, by checking the event's object
 * provided as parameter. It only handles data previously sanitized by a
 * BaseMessagingHandler~SanitizerFunction.
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
 * specific handler. A collection of these handlers is handled in each MessagingHandler, and shall be manipulated through the
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
 * This function is the constructor for the common logic of message handling.
 * It contains and manages a list of BmcMessageHandlers, and calls the relevant
 * handler upon receiving a message to dispatch.
 *
 * @class
 *
 * @params {string|undefined} topOrigin - if any, the origin of the topWindow,
 *            to allow accepting messages from it additionally to internal
 *            web-extension messages. This allows exchanging between host
 *            window and web-extension iframes.
 */
function BaseMessagingHandler(topOrigin) {
    this._topOrigin = topOrigin;
    /*
     * an event's origin is actually shown as the extension's internal URL, so
     * let's retrieve the expected value for BMC using runtime.getURL('').
     * We'll check against this value when dispatching/handling messages.
     */
    this._selfOrigin = getBrowser().runtime.getURL('');
    this._handlers = [];
}

/**
 * This method is a pre-check dedicated to window-based event handling,
 * ensuring that the event is indeed supposed to be handled by our code.
 *
 * @method
 *
 * @returns {object} null or valid object
 */
BaseMessagingHandler.prototype._checkWindowMessage = function(event) {
    if (event.type === 'message'
        && !(event instanceof Error)
        /*
         * The origin provided by an event does not include an ending '/' while
         * the URL of the extension does (retrieve on initialization), hence
         * the 'indexOf' method rather than a simple equality comparison.
         * Then we also check against the content script's host page's URL
         */
        && (this._selfOrigin.indexOf(event.origin) !== -1
            || this._topOrigin === event.origin)
        && typeof(event.data) === 'object') {
        return event.data;
    }
    return null;
};

/**
 * This method is an utility which applies the handler selection logic for any
 * given "message" no matter what type is actually behind it.
 *
 * @method
 *
 * @params {Event|object} message
 * @params {BaseMessagingHandler~SanitizerFunction} checkf - checker
 *                      function to apply on the message, ensuring it is indeed
 *                      a message we should dispatch.
 * @params {Boolean} once - true to apply only the first handler selected for this event
 *                          false to apply all selected handlers for this event
 */
BaseMessagingHandler.prototype.dispatch = function(message, checkf, once) {
    const do_once = once || false;
    const sanitized = checkf(message);
    if (sanitized === null || message instanceof Error) {
        LOGS.log('S26', {
            'data': JSON.stringify(event, ['message', 'arguments', 'type', 'name']),
        });
        return;
    }

    let done = false;
    this._handlers.forEach(handler => {
        if ((!do_once || !done) && handler.select(sanitized)) {
            handler.handle(sanitized);
            done = true;
        }
    });
};

/**
 * This function registers the object's handlers as window-messaging handlers,
 * in the relevant callback.
 *
 * Can be used to set-up cross-iframe/window messaging in relevant child
 * classes of BaseMessagingHandler
 *
 * @method
 */
BaseMessagingHandler.prototype.setupWindowMessaging = function() {
    window.addEventListener('message', event => {
        this.dispatch(event, m => this._checkWindowMessage(m));
    });
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
BaseMessagingHandler.prototype._addHandler = function(tag, selector, handler) {
    this._handlers.push(new BmcMessageHandler(tag, selector, handler));
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
BaseMessagingHandler.prototype._removeHandlers = function(tag) {
    this._handlers = this._handlers.filter(handler => handler.tag !== tag);
};


/**
 * This class is a dedicated messaging handler for the background script of the
 * web-extension. It manages a list of connected peers, which are actually the
 * various tabs opened which have loaded the extension's content-scripts.
 * It provides the capability to receive, route, and process messages coming
 * from the various content-scripts, as well as the capability to send a
 * message to them, by id or through a broadcasting approach.
 *
 * @class
 *
 */
function BmcBackgroundMessagingHandler() {
    BaseMessagingHandler.call(this);
    this.peers = {};
    getBrowser().runtime.onConnect.addListener(channel => {
        this.peers[channel.sender.tab.id] = channel;
        // Handle Disconnections and track only connected peers
        channel.onDisconnect.addListener(channel => {
            channel.onMessage.removeListener();
            channel.onDisconnect.removeListener();
            delete this.peers[channel.sender.tab.id];
        });
        // Message handling through BaseMessagingHandler.dispatch
        channel.onMessage.addListener(msg => {
            this.dispatch(msg, e => { return {channel, data: e}; }, true/*once*/);
        });
    });
}
// Inherit from BaseMessagingHandler
BmcBackgroundMessagingHandler.prototype = new BaseMessagingHandler();
BmcBackgroundMessagingHandler.prototype.constructor = BmcBackgroundMessagingHandler;

/**
 * Add a handler for messages received from the sidebar's content-script.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcBackgroundMessagingHandler.prototype.addHandler = function(tag, selector, handler) {
    this._addHandler(tag, selector, handler);
};

/**
 * Remove the selected handlers from the internal list.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcBackgroundMessagingHandler.prototype.removeHandlers = function(tag) {
    this._removeHandlers(tag);
};

/**
 * Sends a message to a sidebar content-script specified by its tab id
 *
 * @method
 * See runtime.Port.postMessage documentation for message description
 */
BmcBackgroundMessagingHandler.prototype.send = function(id, message) {
    const channel = this.peers[id];
    if (channel) {
        channel.postMessage(message);
    }
};

/**
 * Sends a message to all currently connected sidebar content-scripts
 *
 * @method
 * See runtime.Port.postMessage documentation for message description
 */
BmcBackgroundMessagingHandler.prototype.broadcast = function(message) {
    for (const id in this.peers) {
        this.peers[id].postMessage(message);
    }
};


/**
 * This class is a dedicated messaging handler for the extension's entrypoint
 * content-script (loaded directly into the host page).
 *
 * It only manages messaging through the window.postMessage API, between the
 * entrypoint content-script and the sidebar's content-script. It does not
 * allow interacting with the background script.
 *
 * @class
 *
 */
function BmcEntrypointMessagingHandler(topOrigin) {
    BaseMessagingHandler.call(this, topOrigin);
    this.setupWindowMessaging(this);
}
// Inherit from BaseMessagingHandler
BmcEntrypointMessagingHandler.prototype = new BaseMessagingHandler();
BmcEntrypointMessagingHandler.prototype.constructor = BmcEntrypointMessagingHandler;

/**
 * Add a handler for messages received from the sidebar's content-script.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcEntrypointMessagingHandler.prototype.addHandler = function(tag, selector, handler) {
    this._addHandler(tag, selector, handler);
};

/**
 * Remove the selected handlers from the internal list.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcEntrypointMessagingHandler.prototype.removeHandlers = function(tag) {
    this._removeHandlers(tag);
};


/**
 * This class is a dedicated messaging handler for the content-script making up
 * the sidebar (in a dedicated frame injected in the host page).
 *
 * It manages two types of messaging, for two types of targets of interaction:
 * - window.postMessage/addEventListener to communicate with the entrypoint
 *   injected in the hostpage
 * - browser.runtime.connect to initiate a connected session with the
 *   extension's background script
 *
 * Each target is identified in the method names with the words 'Window' and
 * 'Extension' respectively.
 *
 * @class
 *
 */
function BmcSidebarMessagingHandler(topOrigin) {
    // Communication with the window's top frame (web-ext entrypoint)
    BaseMessagingHandler.call(this, topOrigin);
    this.setupWindowMessaging();

    // Communication with the background page (aka extension)
    this._ext =  getBrowser().runtime.connect({name: 'sidebar'});
    this._extHandler = new BaseMessagingHandler();
    this._ext.onMessage.addListener(m => this._onExtMessage(m));
}
// Inherit from BaseMessagingHandler
BmcSidebarMessagingHandler.prototype = new BaseMessagingHandler();
BmcSidebarMessagingHandler.prototype.constructor = BmcSidebarMessagingHandler;

BmcSidebarMessagingHandler.prototype._onExtMessage = function(msg) {
    this._extHandler.dispatch(msg, e => { return {channel: this._ext, data: e}; }, false/*many*/);
};

/**
 * Add a handler for messages received from the extension's background script.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcSidebarMessagingHandler.prototype.addExtensionHandler = function(tag, selector, handler) {
    this._extHandler._addHandler(tag, selector, handler);
};

/**
 * Removes the selected handlers from the background-script dedicated handlers.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcSidebarMessagingHandler.prototype.removeExtensionHandlers = function(tag) {
    this._extHandler._removeHandlers(tag);
};

/**
 * Sends a message to the extension's background scripts
 *
 * @method
 * See runtime.Port.postMessage documentation for parameters description
 */
BmcSidebarMessagingHandler.prototype.sendExtension = function(msg) {
    return this._ext.postMessage(msg);
};

/**
 * Add a handler for messages received from the content-script hosted in the
 * same window (top frame).
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcSidebarMessagingHandler.prototype.addWindowHandler = function(tag, selector, handler) {
    this._addHandler(tag, selector, handler);
};

/**
 * Removes the selected handlers from the content-script dedicated handlers.
 *
 * @method
 * See BaseMessagingHandler._addHandler for parameters specifics
 */
BmcSidebarMessagingHandler.prototype.removeWindowHandler = function(tag) {
    this._removeHandlers(tag);
};

/**
 * Sends a message to the extension's background scripts
 *
 * @method
 * See window.top.postMessage documentation for parameters description
 */
BmcSidebarMessagingHandler.prototype.sendWindow = function(msg) {
    window.top.postMessage(msg, '*');
};
