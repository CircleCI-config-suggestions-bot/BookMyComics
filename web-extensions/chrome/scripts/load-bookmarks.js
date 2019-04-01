/* globals
    BmcDataAPI:readable
    BmcMessagingHandler:readable
    BmcUI:readable
    getBrowser:readable
    LOGS:readable
*/

const uriParams = document.location.search.split('?')[1].split('&');
const hostOrigin = decodeURIComponent(uriParams[0].split('=')[1]);
LOGS.log('S44', {'origin': hostOrigin});

LOGS.log('S45');
const bmcMessaging = new BmcMessagingHandler(hostOrigin);
const bmcDb = new BmcDataAPI();

function BmcMangaList() {
    this._node = document.getElementById('manga-list');
    this._mode = BmcMangaList.MODE_BROWSE;
}

BmcMangaList.prototype.MODE_REGISTER = 'register';
BmcMangaList.prototype.MODE_BROWSE = 'browse';

BmcMangaList.prototype.onAliasClick = function(ev) {
    const comicLabel = ev.target;
    LOGS.log('S46', {'label': ev.target.innerText,
                     'id': ev.target.bmcData.id});
    const evData = {
        type: 'action',
        action: 'alias',
        id: comicLabel.bmcData.id,
    };
    window.top.postMessage(evData, '*');
};

BmcMangaList.prototype.onBrowseClick = function(ev) {
    const comicLabel = ev.target;
    const comicDiv = comicLabel.parentElement;
    const comicElem = comicDiv.parentElement;
    comicElem.querySelector('.nested').classList.toggle('active');
    comicLabel.classList.toggle('rollingArrow-down');
};

BmcMangaList.prototype.onSourceClick = function(comic, source) {
    const ev = {
        type: 'computation',
        module: 'sources',
        computation: 'URL:Generate:Request',
        resource: {
            origin: window.location.origin,
            reader: source.reader,
            comic: Object.assign({
                common: {
                    name: source.name,
                    chapter: comic.chapter,
                    page: comic.page,
                },
            }, source.info),
        },
    };
    let bro = getBrowser();
    bro.runtime.sendMessage(ev, (response, err) => {
        if (err) {
            LOGS.warn('E0013', {'err': err});
            return undefined;
        }
        let localEv = {
            type: 'action',
            action: 'urlopen',
            url: response.resource.url,
        };
        // Let the content script at the page's root handle the URL opening
        window.top.postMessage(localEv, '*');
    });
};

BmcMangaList.prototype.onSourceDelete = function(ev) {
    const icon = ev.target;
    const srcElem = icon.parentElement;
    const srcLink = srcElem.firstChild;
    const srcList = srcElem.parentElement;
    const comicElem = srcList.parentElement;
    const comicDiv = comicElem.firstChild;
    const comicLabel = comicDiv.firstChild;

    LOGS.debug('S57', {
        reader: srcLink.bmcData.reader,
        name: srcLink.bmcData.name,
        comic: comicLabel.innerText,
        id: comicLabel.bmcData.id,
    });
    const evData = {
        type: 'action',
        action: 'delete',
        comic: {
            id: comicLabel.bmcData.id,
        },
        source: {
            reader: srcLink.bmcData.reader,
            name: srcLink.bmcData.name,
        },
    };
    window.top.postMessage(evData, '*');
};

BmcMangaList.prototype.onEntryClick = function(ev) {
    LOGS.log('S48', {'mode': this._mode, 'event': ev});
    switch (this._mode) {
    case BmcMangaList.prototype.MODE_REGISTER:
        this.onAliasClick(ev);
        break ;
    case BmcMangaList.prototype.MODE_BROWSE:
        this.onBrowseClick(ev);
        break ;
    default:
        break ;
    }
};

BmcMangaList.prototype.onEntryDelete = function(ev) {
    const icon = ev.target;
    const comicDiv = icon.parentElement;
    const comicLabel = comicDiv.firstChild;

    LOGS.debug('S58', { comic: comicLabel.innerText, id: comicLabel.bmcData.id });

    const evData = {
        type: 'action',
        action: 'delete',
        comic: {
            id: comicLabel.bmcData.id,
        },
    };
    window.top.postMessage(evData, '*');
};

BmcMangaList.prototype.generateComic = function(comic) {
    const elm = document.createElement('ul');
    elm.classList.toggle('mangaListItem');

    const comicElem = document.createElement('li');
    elm.appendChild(comicElem);

    // Define the content on comic Label's line
    const comicDiv = document.createElement('div');
    comicDiv.classList.add('label-container');
    comicElem.appendChild(comicDiv);

    const comicLabel = document.createElement('div');
    comicLabel.classList.add('label', 'rollingArrow');
    comicLabel.innerText = comic.label;
    comicLabel.bmcData = {
        id: comic.id,
    };
    comicLabel.onclick = this.onEntryClick.bind(this);
    comicDiv.appendChild(comicLabel);

    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('fa', 'fa-trash');
    deleteIcon.setAttribute('aria-hidden', 'true');
    deleteIcon.onclick = this.onEntryDelete.bind(this);
    comicDiv.appendChild(deleteIcon);

    // Define the list of sources beneath the comic's Label
    const comicSrcList = document.createElement('div');
    comicSrcList.classList.toggle('nested');
    comicElem.appendChild(comicSrcList);

    comic.iterSources(source => {
        const srcElem = document.createElement('div');
        srcElem.classList.add('label-container');

        const srcLink = document.createElement('div');
        srcLink.classList.add('label');
        srcLink.innerText = source.reader;
        srcLink.bmcData = {
            reader: source.reader,
            name: source.name,
        };
        srcLink.onclick = this.onSourceClick.bind(this, comic, source);
        srcElem.appendChild(srcLink);

        const deleteSrcIcon = document.createElement('span');
        deleteSrcIcon.classList.add('fa', 'fa-trash');
        deleteSrcIcon.setAttribute('aria-hidden', 'true');
        deleteSrcIcon.onclick = this.onSourceDelete.bind(this);
        srcElem.appendChild(deleteSrcIcon);

        comicSrcList.appendChild(srcElem);
    });

    return elm;
};

BmcMangaList.prototype.generate = function() {
    LOGS.log('S49');
    var mangaList = document.getElementById('manga-list');

    // First, remove any child node, to ensure it's clean before we start
    // generating.
    //
    // NOTE: This method seems to be the most efficient as shown by
    // https://jsperf.com/innerhtml-vs-removechild/15
    while (mangaList.firstChild) {
        mangaList.removeChild(mangaList.firstChild);
    }

    // Now that the parent is a clean slate, let's generate
    bmcDb.list((err, comics) => {
        comics.forEach(
            comic => mangaList.appendChild(this.generateComic(comic))
        );
    });
};

BmcMangaList.prototype.setMode = function() {
    //this._mode = mode;
    this.generate();
};

BmcMangaList.prototype.hideEntry = function(entry) {
    entry.style.display = 'none';
};

BmcMangaList.prototype.showEntry = function(entry) {
    entry.style.display = '';
};

BmcMangaList.prototype.match = function(value, match) {
    var lvalue = value.toLowerCase();
    var lmatch = match.toLowerCase();
    for (var i = 0; i < lmatch.length; ++i) {
        var idx = lvalue.indexOf(lmatch[i]);
        if (idx === -1) {
            return false;
        }
        lvalue = lvalue.slice(idx);
    }
    return true;
};

BmcMangaList.prototype.filter = function(filterStr) {
    for (var i = 0; i < this._node.childNodes.length; ++i) {
        const entry = this._node.childNodes[i];
        // Need to dig through layers to reach the label's text
        const entryLabel = entry    // ul
            .childNodes[0]          // li
            .childNodes[0]          // div
            .childNodes[0];         // span == label
        if (this.match(entryLabel.innerText, filterStr)) {
            this.showEntry(entry);
        } else {
            this.hideEntry(entry);
        }
    }
};

function showRegisterButton() {
    const panel = document.getElementById('side-panel');
    const regBtn = document.getElementById('register-but');
    if (panel && regBtn && panel.style.display === 'none') {
        regBtn.style.display = '';
    }
}

function addEvents(mangaList) {
    // Clicking on the  `>`/`<` button will show/hide the panel
    var but = document.getElementById('hide-but');
    but.onclick = showHideSidePanel;

    // Input in searchbox will filter the list of mangas
    var sbox = document.getElementById('searchbox');
    sbox.oninput = function() {
        LOGS.log('S51');
        var str = sbox.value;
        mangaList.filter(str);
    };

    // On Register-but click, show the SidePanel in "REGISTER" mode
    const regBtn = document.getElementById('register-but');
    if (regBtn) {
        regBtn.onclick = showHideSidePanelAdder;
    }

    // On button-add click, Trigger a new comic registration
    var addBut = document.getElementById('side-adder');
    if (addBut) {
        addBut.onclick = showHideSidePanelAdder;
    }
    var cancelBut = document.getElementById('add-cancel');
    if (cancelBut) {
        cancelBut.onclick = showHideSidePanelAdder;
    }
    var confirmBut = document.getElementById('add-confirm');
    if (confirmBut) {
        confirmBut.onclick = function() {
            const label = document.getElementById('bookmark-name').value.trim();
            if (label.length < 1) {
                return;
            }
            showHideSidePanelAdder();
            // Now do the actual registration
            const evData = {
                type: 'action',
                action: 'register',
                label,
            };
            window.top.postMessage(evData, '*');
        };
    }
    var bookmarkName = document.getElementById('bookmark-name');
    if (bookmarkName) {
        bookmarkName.oninput = function() {
            confirmBut.disabled = this.value.trim().length === 0;
            if (confirmBut.disabled === true) {
                confirmBut.classList.add('disabled');
            } else {
                confirmBut.classList.remove('disabled');
            }
        };
    }

    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'notification',
        evData => {
            LOGS.log('S53', {'op': evData.operation, 'error': evData.error});
            notifyResult(evData.operation, evData.error);
        });
    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'setup' && evData.operation === 'register',
        () => {
            LOGS.log('S54');
            showRegisterButton();
        });
    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'toggle' && evData.module === 'sidebar',
        () => {
            showHideSidePanel();
        });
    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'refresh' && evData.module === 'sidebar',
        () => {
            mangaList.generate();
        });
}

var mangaList = new BmcMangaList();
mangaList.generate();
addEvents(mangaList);


/*
 * This function ensures the transition CSS class is absent, changes the
 * background color (static, instantaneous).
 * Then, it applies the transform class, and finally changes the color back to
 * the original color. This creates a smooth transform from the provided color
 * parameter to the original color.
 */
function triggerTransition(elem, color) {
    // If a transition was already triggered, we expect .style.backgroundColor
    // to be set, while getting the computed style ensure we get a value (even
    // in the first call of this function for that element).
    //
    // If not already triggered, we get the final computed backgroundColor
    // (from CSS sheet).
    //
    // Note that if we only rely on the computed style, we might get a color
    // from an ongoing transition, messing up the expected values if the
    // transitions are somehow triggered multiple times (which can happen if we
    // reconfigure/reload parts of the objects from BookMyComics).
    //
    const origColor = elem.style.backgroundColor || getComputedStyle(elem).backgroundColor;

    // -> Ensure it's not present when setting the color
    elem.classList.remove('notif-transform');

    // Now set the color to transition from
    elem.style.backgroundColor = color;

    /*
     * /!\ NOTE IMPORTANT /!\
     * Accessing a DOM property seems to force a redraw, preventing browser
     * optimization on style settings (by batching updates) which might
     * actually hide the transition.
     * /!\ NOTE IMPORTANT /!\
     */
    void elem.offsetHeight;

    // Add the transition effect _before_ changing the color
    elem.classList.add('notif-transform');

    // And finally set the color to get back to (original color)
    // => This triggers the actual transition effect
    elem.style.backgroundColor = origColor;

    // Remove all mentions of transitions after 2 secs
    setTimeout(() => {
        removeTransitions();
    }, 2000);
}

function removeTransitions() {
    LOGS.warn('E0015');
    const togBtn = document.getElementById('hide-but');
    togBtn.classList.remove('notif-transform');
}

function notifyResult(operation, error) {
    let transitionColor = error ? '#ff0000' : '#00ff00';
    const togBtn = document.getElementById('hide-but');
    triggerTransition(togBtn, transitionColor);
    if (error) {
        LOGS.error('E0016', {operation, 'error': error.message});
    }
}

function shiftButtonRight(btn) {
    if (btn) {
        btn.classList.add('right');
        btn.classList.remove('left');
    }
}

function shiftButtonLeft(btn) {
    if (btn) {
        btn.classList.remove('right');
        btn.classList.add('left');
    }
}

function showHideSidePanel() {
    var evData = {
        type: 'action',
        action: null,
    };
    var togBtn = document.getElementById('hide-but');
    var regBtn = document.getElementById('register-but');
    var panel = document.getElementById('side-panel');

    // Ensure no transition will be ongoing after the state change.
    // removeTransitions();

    // Now, do the actual toggling
    if (panel.style.display === 'none') {
        mangaList.setMode();
        evData.action = 'ShowSidePanel',
        panel.style.display = '';
        panel.style.width = 'calc(100vw - 16px)';
        togBtn.innerText = '<';
        shiftButtonRight(togBtn);
        regBtn.style.display = 'none';
    } else {
        evData.action = 'HideSidePanel',
        panel.style.display = 'none';
        panel.style.width = '0';
        togBtn.innerText = '>';
        shiftButtonLeft(togBtn);
        regBtn.style.display = 'none';
    }
    // Notify top window of the SidePanel action
    window.top.postMessage(evData, '*');
}

function showHideSidePanelAdder() {
    var sidePanel = document.getElementById('side-panel');
    var sidePanelAdder = document.getElementById('side-panel-adder');
    var hideBut = document.getElementById('hide-but');
    var regBtn = document.getElementById('register-but');

    if (sidePanelAdder.style.display === 'block') {
        var prev = sidePanel.getAttribute('prev');
        sidePanel.setAttribute('prev', '');
        sidePanel.style.display = prev;
        sidePanelAdder.style.display = '';
        hideBut.style.display = '';
        if (prev === 'none') {
            regBtn.style.display = '';
        }
    } else {
        var bookmarkName = document.getElementById('bookmark-name');
        var confirmBut = document.getElementById('add-confirm');

        sidePanel.setAttribute('prev', sidePanel.style.display);
        sidePanel.style.display = 'none';
        sidePanelAdder.style.display = 'block';
        bookmarkName.value = '';
        hideBut.style.display = 'none';
        bookmarkName.focus();
        confirmBut.classList.add('disabled');
        confirmBut.disabled = true;
        regBtn.style.display = 'none';
    }
}

// Hide panel by default
showHideSidePanel();
