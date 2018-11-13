const uriParams = document.location.search.split('?')[1].split('&');
const readerName = decodeURI(uriParams[0].split('=')[1]);
const comicName = decodeURI(uriParams[1].split('=')[1]);
const chapter = uriParams[2].split('=')[1];
const page = uriParams[3].split('=')[1];
console.log(`BmcSideBar: reader=${readerName}, comic=${comicName}, chapter=${chapter}, page=${page}`);

function BmcMangaList() {
    this._node = document.getElementById('manga-list');
    this._mode = BmcMangaList.MODE_BROWSE;
}

BmcMangaList.prototype.MODE_REGISTER = 'register';
BmcMangaList.prototype.MODE_BROWSE = 'browse';

BmcMangaList.prototype.onEntryClick = function(comicId) {
    console.log('clickedOnManga!, mode=' + this._mode);
    switch (this._mode) {
    case BmcMangaList.prototype.MODE_REGISTER:
        this.onAliasClick(comicId);
        break ;
    case BmcMangaList.prototype.MODE_BROWSE:
        // Find a source for the manga and change the URL to that.
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
    comicLabel.onclick = () => {
        comicDiv.parentElement.querySelector('.nested').classList.toggle('active');
        comicLabel.classList.toggle('rollingArrow-down');
    }
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
    var bookmarks = [
        {label: "naruto",           id: 0},
        {label: "bleach",           id: 1},
        {label: "one piece",        id: 2},
        {label: "goblin slayer",    id: 3},
        {label: "hunter x hunter",  id: 4},
    ];

    console.log("generating bookmark list");
    var mangaList = document.getElementById("manga-list");
    bookmarks.forEach(bkmk => {
        comic = new BmcComic(bkmk.label, bkmk.id, 3, 21);
        comic.addSource(new BmcComicSource(bkmk.label, 'mangaeden'));
        comic.addSource(new BmcComicSource(bkmk.label, 'mangafox'));
        comic.addSource(new BmcComicSource(bkmk.label, 'mangahere'));
        comic.addSource(new BmcComicSource(bkmk.label, 'mangareader'));
        console.warn('fake comic generated for', bkmk.label);
        mangaList.appendChild(this.generateComic(comic))
        console.warn('fake comic added for', bkmk.label);
    });
}

BmcMangaList.prototype.setMode = function(mode) {
    switch (mode) {
    case BmcMangaList.prototype.MODE_REGISTER:
    case BmcMangaList.prototype.MODE_BROWSE:
        this._mode = mode;
        break ;
    default:
        console.warn(`BmcSidePanel: BmcMangaList: Unknown MODE "${mode}"`);
        break ;
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
        if (this.match(entry.innerText, filterStr)) {
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
        // FIXME TODO FIXME
    };

}

var mangaList = new BmcMangaList();
mangaList.generate();
addEvents(mangaList);


function showHideSidePanel(mode) {
    var evData = {
        type: "action",
        action: null,
    };
    var togBtn = document.getElementById('hide-but');
    var regBtn = document.getElementById('register-but');
    var panel = document.getElementById("side-panel");
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
