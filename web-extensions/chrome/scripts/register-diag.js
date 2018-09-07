console.log(`URL is : ${document.location.search}`);
const uriParams = document.location.search.split('?')[1].split('&');
const comicName = decodeURI(uriParams[0].split('=')[1]);
const chapter = uriParams[1].split('=')[1];
const page = uriParams[2].split('=')[1];
console.log(`BmcInfoBar: comic ${comicName}, chapter=${chapter}, page=${page}`);


document.getElementById('registerComic').addEventListener('click', () => {
    console.log('Clicked "Register"');
    const engine = new BmcEngine();
    engine.addEventListener(engine.events.register.error, err => {
    });
    engine.addEventListener(engine.events.register.complete, () => {
        console.log('Messaging main window for InfoBar removal');
        window.top.postMessage('RemoveInfoBar', '*');
    });
    engine.register(comicName, chapter, page);
});

document.getElementById('aliasComic').addEventListener('click', () => {
    // XXX TODO FIXME
    // Ideally, this function should spawn a drop-down overlay menu to offer
    // the possibility to select an existing tracked manga to link the current
    // page to.
    // XXX TODO FIXME
    console.log('Clicked "Alias"');
    const engine = new BmcEngine();
    engine.addEventListener(engine.events.alias.error, err => {
    });
    engine.addEventListener(engine.events.alias.complete, () => {
        console.log('Messaging main window for InfoBar removal');
        window.parent.postMessage('RemoveInfoBar', '*');
    });
    engine.alias(comicName, chapter, page);
});

document.getElementById('ignoreComic').addEventListener('click', () => {
    console.log('Clicked "Ignore"');
    const engine = new BmcEngine();
    engine.addEventListener(engine.events.ignore.error, err => {
    });
    engine.addEventListener(engine.events.ignore.complete, () => {
        console.log('Messaging main window for InfoBar removal');
        window.parent.postMessage('RemoveInfoBar', '*');
    });
    engine.ignore(comicName, chapter, page);
});

console.log('Registered click events for register, alias and ignore buttons');
