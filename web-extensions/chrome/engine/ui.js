/**
 *
 */
function BmcUI() {
}

function isChrome() {
    return window.chrome !== undefined;
}

BmcUI.prototype.INFOBAR_ID = 'BmcInfoBar';
BmcUI.prototype.SIDEPANEL_ID = 'BmcSidePanel';

BmcUI.prototype.setupMessages = function(func) {
    // Setup the cross-window (iframe actually) messaging to get notified when
    // the iframe will have spent its usefulness.
    window.addEventListener('message', event => {
        if (event.type === 'message') {
            if (typeof(event) === 'Error') {
                console.log(`Got message error: ${JSON.stringify(err, ["message", "arguments", "type", "name"])}`);
            } else {
                console.log(`Got Message: ${JSON.stringify(event)}`)
            }
        }
        if (event.type === 'message' && event.origin === '*') {
            func(event);
        }
    });
}

BmcUI.prototype.makeInfobar = function(resourcePath) {
    var height = '40px';
    var iframe = document.createElement('iframe');
    iframe.id = this.INFOBAR_ID;
    iframe.src = resourcePath;
    console.log(`Inserting iframe src=${iframe.src}`);
    iframe.style.width = '100vw';
    iframe.style.height = height;
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '1000000'; // Some high value
    iframe.style.border = 'none';
    // Etc. Add your own styles if you want to
    document.documentElement.appendChild(iframe);

    // Ensure that he added toolbar will "shift" the page's content downwards
    // to avoid the overlay effect, and instead actually insert it at the top
    var bodyStyle = document.body.style;
    var cssTransform = 'transform' in bodyStyle ? 'transform' : 'webkitTransform';
    bodyStyle[cssTransform] = 'translateY(' + height + ')';
    this.setupMessages(function(event) {
        if (event.data === 'RemoveInfoBar') {
            iframe.parentNode.removeChild(iframe);
        }
    });
};

BmcUI.prototype.buildSidePanel = function(resourcePath) {
    var height = '100vh';
    var iframe = document.createElement('iframe');
    iframe.id = this.SIDEPANEL_ID;
    iframe.src = resourcePath;
    console.log(`Inserting iframe src=${iframe.src}`);
    iframe.style.width = '200px';
    iframe.style.height = '100vh';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '1000001'; // Some high value
    iframe.style.border = 'none';
    // Etc. Add your own styles if you want to
    document.documentElement.appendChild(iframe);
    this.setupMessages(function(event) {
        try {
            var data = JSON.parse(event.data);
        } catch(e) {
            console.log(e);
            return;
        }
        console.log('message received: ' + data['comicName']);
    });
};

BmcUI.prototype.makeRegisterDialog = function(comicName, chapter, page) {
    var bro = getBrowser();
    this.makeInfobar(bro.runtime.getURL('register-diag.html')
        + `?comicName=${encodeURIComponent(comicName)}&chapter=${chapter}&page=${page}`);
};

BmcUI.prototype.removeRegisterDialog = function() {
    const infobar = document.getElementById(this.INFOBAR_ID);
    infobar.parentNode.removeChild(infobar);
};

BmcUI.prototype.makeSidePanel = function() {
    var bro = getBrowser();
    this.buildSidePanel(bro.runtime.getURL('sidebar.html'));
};

BmcUI.prototype.removeSidePanel = function() {
    const sidepanel = document.getElementById(this.SIDEPANEL_ID);
    sidepanel.parentNode.removeChild(sidepanel);
};

BmcUI.prototype.makeTrackingNotification = function(err) {
    if (err) {
        alert('BookMyComic: BmcUI.makeTrackingNotification: Could not save comic progress: ' + err.message);
        return ;
    }
    alert('BookMyComic: BmcUI.makeTrackingNotification: progress saved');
};
