/**
 *
 */
function BmcUI() {
}

BmcUI.prototype.makeRegisterDialog = function() {
    alert('BookMyComic: bmcUI.makeRegisterDialog: Please register comic');
};

BmcUI.prototype.makeTrackingNotification = function(err) {
    if (err) {
        alert('BookMyComic: BmcUI.makeTrackingNotification: Could not save comic progress: ' + err.message);
        return ;
    }
    alert('BookMyComic: BmcUI.makeTrackingNotification: progress saved');
};

BmcUI.prototype.makeSidePanel = function() {
};
