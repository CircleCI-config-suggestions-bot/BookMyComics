const uriParams = document.location.search.split('?')[1].split('&');
const hostOrigin = decodeURIComponent(uriParams[0].split('=')[1]);
console.log(`BmcSideBar: origin ${hostOrigin}`);

console.log('Loading required Bmc utilities');
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
    console.log(`BmcSideBar: BmcMangaList: onAlias: Label=${ev.target.innerText} id=${ev.target.bmcData.id}`);
    const evData = {
        type: "action",
        action: "alias",
        id: comicLabel.bmcData.id,
    };
    window.top.postMessage(evData, '*');
}

BmcMangaList.prototype.onBrowseClick = function(ev) {
    const comicLabel = ev.target;
    const comicDiv = comicLabel.parentElement;
    const comicElem = comicDiv.parentElement;
    comicElem.querySelector('.nested').classList.toggle('active');
    comicLabel.classList.toggle('rollingArrow-down');
}

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
            console.warn(`BookMyComics: load-bookmark.js: sendmessage failed: err=${err}`);
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
}

BmcMangaList.prototype.onEntryClick = function(ev) {
    console.log('clickedOnManga!, mode=' + this._mode + ', event: ' + ev);
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
}

BmcMangaList.prototype.generateComic = function(comic) {
    const elm = document.createElement('ul');
    elm.classList.toggle('mangaListItem');

    const comicElem = document.createElement('li');
    elm.appendChild(comicElem);

    const comicDiv = document.createElement('div');
    comicElem.appendChild(comicDiv);

    const comicLabel = document.createElement('span');
    comicLabel.classList.toggle('rollingArrow');
    comicLabel.innerText = comic.label;
    comicLabel.bmcData = {
        id: comic.id,
    };
    comicLabel.onclick = this.onEntryClick.bind(this);
    comicDiv.appendChild(comicLabel);

    const comicSrcList = document.createElement('div');
    comicSrcList.classList.toggle('nested');
    comicElem.appendChild(comicSrcList);

    comic.iterSources(source => {
        const srcElem = document.createElement('div');
        srcElem.innerText = source.reader;
        comicSrcList.appendChild(srcElem);
        srcElem.onclick = this.onSourceClick.bind(this, comic, source);
    });

    return elm;
}

BmcMangaList.prototype.generate = function() {
    console.log("generating bookmark list");
    var mangaList = document.getElementById("manga-list");

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
       comics.forEach(comic =>
            mangaList.appendChild(this.generateComic(comic))
       );
    });
}

BmcMangaList.prototype.setMode = function(mode) {
    var btn = document.getElementById('side-adder');
    switch (mode) {
    case BmcMangaList.prototype.MODE_REGISTER:
        btn.style.display = '';
        this._mode = mode;
        this.generate();
        break ;
    case BmcMangaList.prototype.MODE_BROWSE:
        btn.style.display = 'none';
        this._mode = mode;
        this.generate();
        break ;
    default:
        console.warn(`BmcSidePanel: BmcMangaList: Unknown MODE "${mode}"`);
        return ;
    }
}

BmcMangaList.prototype.hideEntry = function(entry) {
    entry.style.display = 'none';
}

BmcMangaList.prototype.showEntry = function(entry) {
    entry.style.display = '';
}

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
}

BmcMangaList.prototype.filter = function(filterStr) {
    for (var i = 0; i < this._node.childNodes.length; ++i) {
        entry = this._node.childNodes[i];
        // Need to dig through layers to reach the label's text
        entryLabel = (entry             // ul
                      .childNodes[0]    // li
                      .childNodes[0]    // div
                      .childNodes[0]);  // span == label
        if (this.match(entryLabel.innerText, filterStr)) {
            this.showEntry(entry);
        } else {
            this.hideEntry(entry);
        }
    };
}

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
    but.onclick = function() {
        showHideSidePanel();
    };

    // Input in searchbox will filter the list of mangas
    var sbox = document.getElementById('searchbox');
    sbox.oninput = function() {
        console.log('Input of searchbox changed: filtering bookmarks list');
        var str = sbox.value;
        mangaList.filter(str);
    };

    // On Register-but click, show the SidePanel in "REGISTER" mode
    const regBtn = document.getElementById('register-but');
    if (regBtn) {
        regBtn.onclick = function() {
            showHideSidePanel(mangaList.MODE_REGISTER);
        };
    }

    // On button-add click, Trigger a new comic registration
    var addBut = document.getElementById('side-adder');
    if (addBut) {
        addBut.onclick = function() {
            const label = sbox.value;
            // Sanitize the data first
            if (sbox.value.length <= 0) {
                alert("BookMyComics does not support empty labels to identify a comic.<br>"
                      + "Please define a label in the Side Panel's text area first.");
            }

            // Now do the actual registration
            const evData = {
                type: "action",
                action: "register",
                label,
            };
            window.top.postMessage(evData, '*');
        };
    }

    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'notification',
        evData => {
            console.log(`BmcSidePanel: received message to display status notification op=${evData.operation} err=${evData.error}`);
            notifyResult(evData.operation, evData.error);
        });
    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'setup' && evData.operation === 'register',
        evData => {
            console.log('BmcSidePanel: Handling request to show Register button');
            showRegisterButton();
        });
    bmcMessaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'toggle' && evData.module === 'sidebar',
        evData => {
            showHideSidePanel();
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
    console.warn('Removing transition');
    const togBtn = document.getElementById('hide-but');
    togBtn.classList.remove('notif-transform');
}

function notifyResult(operation, error) {
    let transitionColor = error ? '#ff0000' : '#00ff00';
    const togBtn = document.getElementById('hide-but');
    triggerTransition(togBtn, transitionColor);
    if (error) {
        console.error(`BmcSidePanel: ${operation} failed: ${error.message}`);
    }
}

function shiftButtonRight(btn) {
    if (btn) {
        btn.style.left = '';
        btn.style.right = '0';
    }
}

function shiftButtonLeft(btn) {
    if (btn) {
        btn.style.left = '0';
        btn.style.right = 'initial';
    }
}

function showHideSidePanel(mode) {
    var evData = {
        type: "action",
        action: null,
    };
    var togBtn = document.getElementById('hide-but');
    var regBtn = document.getElementById('register-but');
    var panel = document.getElementById("side-panel");

    // Ensure no transition will be ongoing after the state change.
    // removeTransitions();

    // Now, do the actual toggling
    if (panel.style.display === "none") {
        mangaList.setMode(mode || mangaList.MODE_BROWSE);
        evData.action = "ShowSidePanel",
        panel.style.display = '';
        panel.style.width = 'calc(100vw - 16px)';
        togBtn.innerText = '<';
        shiftButtonRight(togBtn);
        regBtn.style.display = 'none';
    } else {
        evData.action = "HideSidePanel",
        panel.style.display = 'none';
        panel.style.width = '0';
        togBtn.innerText = '>';
        shiftButtonLeft(togBtn);
        regBtn.style.display = 'none';
    }
    // Notify top window of the SidePanel action
    window.top.postMessage(evData, '*');
}

// Hide panel by default
showHideSidePanel();
