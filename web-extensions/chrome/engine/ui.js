/**
 *
 */

function BmcUI(messagingHandler, db) {
    this._messaging = messagingHandler;
    this._db = db;
}

function isChrome() {
    return window.chrome !== undefined;
}

BmcUI.prototype.SIDEPANEL_ID = FrameFinder.definitions.SIDEPANEL.id;

BmcUI.prototype.buildSidePanel = function(setupTracker, resourcePath) {
    var height = '100vh';
    var iframe = document.createElement('iframe');
    iframe.id = this.SIDEPANEL_ID;
    iframe.src = resourcePath;
    LOGS.log('S31', {'src': iframe.src});
    iframe.style.width = '200px';
    iframe.style.height = '100vh';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '1000000'; // Some high value
    iframe.style.border = 'none';
    // Etc. Add your own styles if you want to
    document.documentElement.appendChild(iframe);
    this._messaging.addWindowHandler(
        this.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'HideSidePanel',
        evData => {
            LOGS.log('S32');
            this._db._data.set({'sidebar-displayed': 'false'});
            // Do not check if infobar is still around.
            // -> It's NOT supposed to be.
            setupTracker();
        });
    this._messaging.addWindowHandler(
        this.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'ShowSidePanel',
        evData => {
            LOGS.log('S33');
            this._db._data.set({'sidebar-displayed': 'true'});
            this.removeRegisterDialog();
        });
    this._db._data.get('sidebar-displayed', (err, value) => {
        if (value === 'true') {
            this.toggleSidePanel();
        }
    });
};

BmcUI.prototype.toggleSidePanel = function() {
    const evData = {
        type: 'action',
        action: 'toggle',
        module: 'sidebar',
    };
    const sidepanel = FrameFinder.findWindow(FrameFinder.definitions.SIDEPANEL);
    if (!sidepanel) {
        return ;
    }
    sidepanel.postMessage(evData, '*');
}

BmcUI.prototype.makeRegisterDialog = function(comicName, chapter, page) {
    // Build the message to send, to force showing the register button
    var evData = {
        type: "action",
        action: "setup",
        operation: "register",
    };
    const sidepanel = FrameFinder.findWindow(FrameFinder.definitions.SIDEPANEL);
    if (!sidepanel) {
        return ;
    }
    sidepanel.postMessage(evData, '*');
};

BmcUI.prototype.removeRegisterDialog = function() {
};

BmcUI.prototype.makeSidePanel = function(setupTracker, hostOrigin) {
    var bro = getBrowser();
    const origin = encodeURIComponent(hostOrigin);
    this.buildSidePanel(setupTracker, bro.runtime.getURL('sidebar.html')
        + `?hostOrigin=${origin}`);
};

BmcUI.prototype.removeSidePanel = function() {
    const sidepanel = FrameFinder.findWindow(FrameFinder.definitions.SIDEPANEL);
    if (!sidepanel) {
        return ;
    }
    sidepanel.parentNode.removeChild(sidepanel);
    this._messaging.removeWindowHandlers(this.SIDEPANEL_ID);
};

BmcUI.prototype.makeTrackingNotification = function(err) {
    var evData = {
        type: "action",
        action: "notification",
        operation: "track",
        error: err,
    };
    const sidepanel = FrameFinder.findWindow(FrameFinder.definitions.SIDEPANEL);
    if (!sidepanel) {
        return ;
    }
    LOGS.log('S34');
    sidepanel.postMessage(evData, '*');
};
