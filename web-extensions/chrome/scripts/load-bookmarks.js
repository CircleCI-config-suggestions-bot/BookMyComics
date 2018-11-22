const uriParams = document.location.search.split('?')[1].split('&');
const hostOrigin = decodeURIComponent(uriParams[0].split('=')[1]);
const readerName = decodeURIComponent(uriParams[1].split('=')[1]);
const comicName = decodeURIComponent(uriParams[2].split('=')[1]);
const chapter = uriParams[3].split('=')[1];
const page = uriParams[4].split('=')[1];
console.log(`BmcSideBar: origin ${hostOrigin} : comic ${comicName}, chapter=${chapter}, page=${page}`);

console.log('Loading Engine');
const bmcEngine = new BmcEngine(hostOrigin, readerName, comicName, chapter, page);

function BmcMangaList() {
    this._node = document.getElementById('manga-list');
    this._mode = BmcMangaList.MODE_BROWSE;
}

BmcMangaList.prototype.MODE_REGISTER = 'register';
BmcMangaList.prototype.MODE_BROWSE = 'browse';

BmcMangaList.prototype.onAliasClick = function(ev) {
    const comicLabel = ev.target;
    console.log(`BmcSideBar: BmcMangaList: onAlias: Label=${ev.target.innerText} id=${ev.target.id} reader=${readerName} name=${comicName}`);
    const handleAliasError = err => {
        bmcEngine.removeEventListener(bmcEngine.events.alias.error, handleAliasError);
        bmcEngine.removeEventListener(bmcEngine.events.alias.complete, handleAliasSuccess);
        this.setMode(this.MODE_BROWSE);
        showHideSidePanel();
        notifyResult('Alias Comic', new Error('Could not alias current page to comicId ' + comicId + ': ' + err.message));
    };
    const handleAliasSuccess = () => {
        bmcEngine.removeEventListener(bmcEngine.events.alias.error, handleAliasError);
        bmcEngine.removeEventListener(bmcEngine.events.alias.complete, handleAliasSuccess);
        this.setMode(this.MODE_BROWSE);
        showHideSidePanel();
        notifyResult('Alias Comic', null);
    };
    bmcEngine.addEventListener(bmcEngine.events.alias.error, handleAliasError);
    bmcEngine.addEventListener(bmcEngine.events.alias.complete, handleAliasSuccess);
    // Don't need to provide the reader/name/chapter/pages, as they're
    // already set in the engine since the instanciation.
    bmcEngine.alias(comicLabel.bmcData.id);
}

BmcMangaList.prototype.onBrowseClick = function(ev) {
    const comicLabel = ev.target;
    const comicDiv = comicLabel.parentElement;
    const comicElem = comicDiv.parentElement;
    comicElem.querySelector('.nested').classList.toggle('active');
    comicLabel.classList.toggle('rollingArrow-down');
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
    bmcEngine._db.list((err, comics) => {
       comics.forEach(comic =>
            mangaList.appendChild(this.generateComic(comic))
       );
    });
}

BmcMangaList.prototype.setMode = function(mode) {
    switch (mode) {
    case BmcMangaList.prototype.MODE_REGISTER:
    case BmcMangaList.prototype.MODE_BROWSE:
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

    // On Register-but click, Trigger a new comic registration
    var but = document.getElementById('register-but');
    but.onclick = function() {
        const label = sbox.value;
        // Sanitize the data first
        if (sbox.value.length <= 0) {
            alert("BookMyComics does not support empty labels to identify a comic.<br>"
                  + "Please define a label in the Side Panel's text area first.");
        }

        // Now do the actual registration
        const handleRegisterError = err => {
            bmcEngine.removeEventListener(bmcEngine.events.register.error, handleRegisterError);
            bmcEngine.removeEventListener(bmcEngine.events.register.complete, handleRegisterSuccess);
            mangaList.setMode(mangaList.MODE_BROWSE);
            showHideSidePanel();
            notifyResult('Register Comic', new Error('Could not alias current page to comicId ' + comicId));
        };
        const handleRegisterSuccess = () => {
            bmcEngine.removeEventListener(bmcEngine.events.register.error, handleRegisterError);
            bmcEngine.removeEventListener(bmcEngine.events.register.complete, handleRegisterSuccess);
            mangaList.setMode(mangaList.MODE_BROWSE);
            showHideSidePanel();
            notifyResult('Register Comic');
        };
        bmcEngine.addEventListener(bmcEngine.events.register.error, handleRegisterError);
        bmcEngine.addEventListener(bmcEngine.events.register.complete, handleRegisterSuccess);
        // Don't need to provide the reader/name/chapter/pages, as they're
        // already set in the engine since the instanciation.
        bmcEngine.register(label);
    };

    bmcEngine._messaging.addWindowHandler(
        BmcUI.prototype.SIDEPANEL_ID,
        evData => evData.type === 'action' && evData.action === 'notification',
        evData => {
            console.log(`BmcSidePanel: received message to display status notification op=${evData.operation} err=${evData.error}`);
            notifyResult(evData.operation, evData.error);
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
    // Ensure we get the final computed one (from CSS sheet), as using `.style`
    // only accesses inline values.
    const origColor = getComputedStyle(elem).backgroundColor;

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
        if (mode === mangaList.MODE_REGISTER) {
            regBtn.style.display = '';
        }
        togBtn.innerText = '<';
        togBtn.style.left = '';
        togBtn.style.right = '0';
    } else {
        evData.action = "HideSidePanel",
        panel.style.display = 'none';
        panel.style.width = '0';
        regBtn.style.display = 'none';
        togBtn.innerText = '>';
        togBtn.style.left = '0';
        togBtn.style.right = 'initial';
    }
    // Notify top window of the SidePanel action
    window.top.postMessage(evData, '*');
}

// Hide panel by default
showHideSidePanel();
