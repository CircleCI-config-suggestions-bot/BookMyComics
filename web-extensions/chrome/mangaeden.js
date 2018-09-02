function sendUpdatesForMangaEden() {
    var path = window.location.pathname;
    var parts = path.split("/").filter(function(s) { return s.length !== 0});

    if (parts.length < 3) {
        return;
    }
    var manga = parts[2];
    var chapter = null;
    var page = null;
    if (parts.length > 4) {
        chapter = parts[3];
        page = parts[4];
    }
    console.log("current manga: " + manga);
    if (chapter !== null) {
        console.log("current chapter: " + chapter);
        if (page !== null) {
            console.log("current page: " + page);
        }
    }
    const db = new BmcDataAPI();
    console.log('Instanciated BmcDataAPI');
    db.findComic(manga, (err, id) => {
        if (err) {
            console.log('Got err from Find');
            return ;
        }
        console.log(`Got id from storage: ${id}`);
        if (id === null) {
            alert('Please register comic');
        } else {
            db.updateComic(comicId, chapter, page, (err) => {
                if (err) {
                    alert('BookMyComic could not save your reading progress');
                }
            });
        }
    });
}

sendUpdatesForMangaEden();
