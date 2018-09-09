function generateBookmarkList(bookmarks) {
    console.log("generating bookmark list");
    var mangaList = document.getElementById("manga-list");
    for (var i = 0; i < bookmarks.length; ++i) {
        var manga = document.createElement('div');
        manga.innerText = bookmarks[i];
        manga.onclick = function() {
            clickedOnManga(this.innerText);
        };
        mangaList.appendChild(manga);
    }
}

function clickedOnManga(comicName) {
    const engine = new BmcEngine();
    engine.addEventListener(engine.events.register.error, err => {
    });
    engine.addEventListener(engine.events.register.complete, () => {
        console.log('clickedOnManga!');
        window.top.postMessage(`{"comicName": "${comicName.split('"').join('\\"')}"}`, '*');
    });
    engine.register(comicName, null, null);
}

function addEvents() {
    var but = document.getElementById('hide-but');
    but.onclick = function() {
        showHideSidePanel(but);
    };
}

function showHideSidePanel(elem) {
    var panel = document.getElementById("manga-list");
    if (panel.style.display === "none") {
        panel.style.display = '';
        elem.innerText = '<';
        elem.style.left = '';
        elem.style.right = '0';
    } else {
        panel.style.display = 'none';
        elem.innerText = '>';
        elem.style.left = '0';
        elem.style.right = 'initial';
    }
}

var fakeBookmarks = ["naruto", "bleach", "one piece", "goblin slayer", "hunter x hunter"];
generateBookmarkList(fakeBookmarks);
addEvents();
