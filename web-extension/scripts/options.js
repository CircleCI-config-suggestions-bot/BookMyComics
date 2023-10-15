/* globals
    LOGS:readable
    BmcStorageFactory:readable
    BmcDataAPI:readable
    BmcSidebarMessagingHandler:readable
    BmcSettings:readable
*/


const bmcMessaging = new BmcSidebarMessagingHandler(document.location.origin);
const bmcSettings = new BmcSettings();


function BmcOptionsMenu() {
    this._current_storage = BmcStorageFactory.new(null, bmcSettings);
    this._data_api = new BmcDataAPI(this._current_storage);
}

BmcOptionsMenu.prototype.setVisualNotif = function(elem_id, color) {
    // => Let's use a fading colored background, like the tracking notification
    const zone = document.getElementById(elem_id);
    const origColor = zone.style.backgroundColor || getComputedStyle(zone).backgroundColor;

    // -> Ensure it's not present when setting the color
    zone.classList.remove('notif-transform');
    //
    // Now set the color to transition from
    zone.style.backgroundColor = color;

    // Force yielding to the browser via the setTimeout(..., 0);
    setTimeout(() => {
        // Add the transition effect _before_ changing the color
        zone.classList.add('notif-transform');

        // And finally set the color to get back to (original color)
        // => This triggers the actual transition effect
        zone.style.backgroundColor = origColor;

        // Remove transition after 2 secs
        setTimeout(() => {
            zone.classList.remove('notif-transform');
        }, 2000);
    }, 0);
};

BmcOptionsMenu.prototype.initialize = function() {
    /* Initialize the drop-down menu to select the storage engine */
    const sel = document.getElementById('storage-selector');
    const dflt = BmcStorageFactory.default(bmcSettings);
    for (let i = 0; i < BmcStorageFactory.engines.length; ++i) {
        const name = BmcStorageFactory.engines[i].engine_name;
        const opt = document.createElement('option');
        opt.value = name;
        opt.text = name;
        sel.appendChild(opt);
        if (name === dflt) {
            sel.selectedIndex = i;
        }
    }
    const eng_btn = document.getElementById('storage-engine-submit');
    eng_btn.onclick = () => this.handleSubmit();

    /* Initialize Importer & Exporter buttons & logic */
    const ex_btn = document.getElementById('storage-exporter');
    ex_btn.onclick = () => {
        bmcMessaging.addExtensionHandler(
            'options-export',
            ev => ev.data.type === 'action'
                && ev.data.action === 'notification'
                && ev.data.operation === 'export',
            ev => {
                if (ev.data.error) {
                    // TODO
                    alert(LOGS.getString('', {err: ev.data.error}));
                    return ;
                }
                const link = document.createElement('a');
                link.href = `data:application/json,${encodeURIComponent(ev.data.payload)}`;
                link.download = 'bmc-data.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                bmcMessaging.removeExtensionHandlers('options-export');
            });
        // The handler we've just registered will handle the background
        // script's response accordingly.
        bmcMessaging.sendExtension({type: 'action', action: 'export'});
    };
    // Setup import form submit behavior
    const import_btn = document.getElementById('storage-import-submit');
    import_btn.onclick = () => this.handleImport();
};

BmcOptionsMenu.prototype.handleSubmit = function() {
    // Handle Storage engine update
    const sel = document.getElementById('storage-selector');
    const new_engine = sel.options[sel.selectedIndex].value;
    const old_engine = BmcStorageFactory.default(bmcSettings);
    if (old_engine !== new_engine) {
        LOGS.log('S3', {source: old_engine, target: new_engine});
        bmcMessaging.addExtensionHandler(
            'options-storage-configure',
            ev => ev.data.type === 'action'
                && ev.data.action === 'notification'
                && ev.data.operation === 'configure'
                && ev.data.module === 'storage',
            ev => {
                bmcMessaging.removeExtensionHandlers('options-storage-configure');
                if (ev.data.error) {
                    // TODO
                    alert(LOGS.getString('TBD', {err: ev.data.error}));
                    this.setVisualNotif('storage-engine-form', 'red');
                    return ;
                }
                this.setVisualNotif('storage-engine-form', 'green');
            });
        const evData = {
            type: 'action',
            action: 'configure',
            module: 'storage',
            source: old_engine,
            target: new_engine,
        };
        bmcMessaging.sendExtension(evData);
    }
};

BmcOptionsMenu.prototype.handleImport = function() {
    const file = document.getElementById('import-file').files[0];
    file.text().then((data) => {
        bmcMessaging.addExtensionHandler(
            'options-import',
            ev => ev.data.type === 'action'
                && ev.data.action === 'notification'
                && ev.data.operation === 'import',
            ev => {
                if (ev.data.error) {
                    // TODO
                    alert(LOGS.getString('', {err: ev.data.error}));
                    this.setVisualNotif('storage-import-form', 'red');
                    return ;
                }
                bmcSettings.refresh((err) => {
                    bmcMessaging.removeExtensionHandlers('options-import');
                    if (err) {
                        // TODO
                        alert(LOGS.getString('', {err: err}));
                        return ;
                    }
                    // Notify that the operation succeeded
                    // Without this, while the triggering notification is sent
                    // only once the import is complete, the user (or the test)
                    // has no way to actually know when the import was completed.
                    this.setVisualNotif('storage-import-form', 'green');
                });
            });
        bmcMessaging.sendExtension({type: 'action', action: 'import', payload: data});
    });
};

let options = null;
bmcSettings.refresh((err) => {
    if (err) {
        // TODO
        alert(LOGS.getString('', {err: err}));
        return ;
    }
    options = new BmcOptionsMenu();
    options.initialize();
});
