/**
 *
 */
function BmcEngine() {
    this._db = new BmcDataAPI();
    console.log('Instanciated BmcDataAPI');
    this._ui = new BmcUI();
    console.log('Instanciated BmcUI');
}

BmcEngine.prototype.track = function(comicName, chapter, page) {
    console.log(`BookMyComic: bmcEngine.track: manga=${manga} chapter=${chapter} page=${page}`);
    this._db.findComic(manga, (err, id) => {
        if (err) {
            console.log('BookMyComic: Could not track comic: Database error (step1)');
            return ;
        }
        console.log(`BookMyComic: bmcEngine.track: Got id from storage: ${id}`);
        if (id === null) {
            return this._ui.makeRegisterDialog();
        }
        this._db.updateComic(comicId, chapter, page,
                             err => this._ui.makeTrackingNotification(err));
    });
};
