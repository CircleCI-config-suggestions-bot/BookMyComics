const INFO = 0;
const DEBUG = 1;
const WARNING = 2;
const ERROR = 3;

const DEFAULT_LANG = 'en';

String.prototype.improvedFormatter = String.prototype.improvedFormatter ||
function () {
    "use strict";
    var str = this.toString();

    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments) : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

function Localization(lang = DEFAULT_LANG) {
    this.lang = lang;

    this.STRINGS = {
        'S1': {
            'en': 'Unknown error code',
        },
        'S2': {
            'en': 'BmcEngine._memoizeComic: unknown comic name.',
        },
        'S3': {
            'en': 'BmcEngine: Resetting ID memoization after end of ongoing memoization',
        },
        'S4': {
            'en': 'BmcEngine: Resetting ID memoization',
        },
        'S5': {
            'en': 'Memoization reset complete',
        },
        'S6': {
            'en': 'BmcEngine.track: Nothing to track',
        },
        'S7': {
            'en': 'BookMyComic: bmcEngine.track: manga={manga} chapter={chapter} page={page}',
        },
        'S8': {
            'en': 'Attempting track: event={event}',
        },
        'S9': {
            'en': 'BookMyComic: bmcEngine.track.doTrack: Got comicId from storage: {id}',
        },
        'S10': {
            'en': 'BookMyComic: bmcEngine.register: label={label} reader={reader} manga={manga} chapter={chapter} page={page}',
        },
        'S11': {
            'en': 'Register completed with ERR={err}',
        },
        'S12': {
            'en': 'BookMyComic: bmcEngine.alias: id={comicId} reader={reader} manga={manga}',
        },
        'S13': {
            'en': 'Could not alias current page to comicId {id}: {err}',
        },
        'S14': {
            'en': 'Instanciated {elem}',
        },
        'S15': {
            'en': 'Could not register Comic {label}: {err}',
        },
        'S16': {
            'en': 'Scheme could not retrieve Comic map',
        },
        'S17': {
            'en': 'Cannot add already existing source: {data}',
        },
        'S18': {
            'en': 'Got FIND error: {data}',
        },
        'S19': {
            'en': 'Found data: {data}',
        },
        'S20': {
            'en': 'Could not find comicId: {data}',
        },
        'S21': {
            'en': 'Could not find comic data',
        },
        'S22': {
            'en': 'Cannot go backwards in comic',
        },
        'S23': {
            'en': 'Got Update error: {data}',
        },
        'S24': {
            'en': 'Updated comicId {comicId} successfully',
        },
        'S25': {
            'en': 'Got error from scheme.nextId(): {data}',
        },
        'S26': {
            'en': 'Got message error: {data}',
        },
        'S27': {
            'en': 'BmcMessagingHandler: EventData is of unexpected type',
        },
        'S28': {
            'en': 'Received RUNTIME message: {msg}',
        },
        'S29': {
            'en': 'BmcMessagingHandler: event is of unexpected type',
        },
        'S30': {
            'en': '[Wrapper] Selected mode: {mode}',
        },
        'S31': {
            'en': 'Inserting iframe src={src}',
        },
        'S32': {
            'en': 'Hiding Side-Panel: Re-setting up tracker',
        },
        'S33': {
            'en': 'Showing Side-Panel: Hiding tracker',
        },
        'S34': {
            'en': 'BmcUi: Sending message to SidePanel for notification display',
        },
        'S35': {
            'en': 'Cannot find an frame with unknown Definition. Please raise the '
              + 'issue to the developers, as it is due to a development '
              + 'mistake.',
        },
        'S36': {
            'en': 'FrameFinder.find: Searching frame with id approach',
        },
        'S37': {
            'en': 'FrameFinder.find: Found frame with inspect approach',
        },
        'S38': {
            'en': 'Could not identify requested frame, please contact the webext'
                          + ' developers.<br/>{data}',
        },
        'S39': {
            'en': 'BookMyComics: entrypoint.js: Requesting URL parsing from background script',
        },
        'S40': {
            'en': 'BookMyComics: entrypoint.js: sendmessage failed: err={err}',
        },
        'S41': {
            'en': 'BookMyComics: entrypoint.js: sendmessage completed: data={data}',
        },
        'S42': {
            'en': 'Instanciated BmcEngine',
        },
        'S43': {
            'en': 'Attempting to reload for iframe: {iframe}',
        },
    };
}

Localization.prototype.getString = function(s, add) {
    if (!this.STRINGS.hasOwnProperty(s)) {
        return 'Unknown string';
    }
    let lang = this.lang;
    if (!this.STRINGS[s].hasOwnProperty(lang)) {
        lang = 'en';
    }
    if (add) {
        return this.STRINGS[s][lang].improvedFormatter(add);
    }
    return this.STRINGS[s][lang];
};

function Logs(level = DEBUG) {
    this.level = level;

    this.ERRORS = {
        'E0000': 'S1',
        'E0001': 'S2',
        'E0002': 'S3',
        'E0003': 'S4',
        'E0004': 'S5',
        'E0005': 'S6',
        'E0006': 'S7',
        'E0007': 'S8',
        'E0008': 'S9',
        'E0009': 'S10',
        'E0010': 'S11',
        'E0011': 'S12',
        'E0012': 'S14',
        'E0013': 'S16',
        'E0014': 'S17',
        'E0015': 'S18',
        'E0016': 'S19',
        'E0017': 'S20',
        'E0018': 'S23',
        'E0019': 'S24',
        'E0020': 'S25',
        'E0021': 'S26',
        'E0022': 'S27',
        'E0023': 'S28',
        'E0024': 'S29',
        'E0025': 'S30',
        'E0026': 'S31',
        'E0027': 'S32',
        'E0028': 'S33',
        'E0029': 'S34',
        'E0030': 'S36',
        'E0031': 'S37',
        'E0032': 'S39',
        'E0033': 'S40',
        'E0034': 'S41',
        'E0035': 'S42',
        'E0036': 'S43',
    };
}

Logs.prototype.display = function(e, printer, add) {
    if (this.ERRORS.hasOwnProperty(e)) {
        printer(`[${e}] ${LOCALIZATION.getString(this.ERRORS[e], add)}`);
    } else {
        this.display('E0000', console.error, e);
    }
};

Logs.prototype.log = function(e, add) {
    this.display(e, console.log, add);
};

Logs.prototype.debug = function(e, add) {
    if (this.level >= DEBUG) {
        this.display(e, console.debug, add);
    }
};

Logs.prototype.warn = function(e, add) {
    if (this.level >= WARNING) {
        this.display(e, console.warn, add);
    }
};

Logs.prototype.error = function(e, add) {
    if (this.level >= ERROR) {
        this.display(e, console.error, add);
    }
};

const LOGS = new Logs();
const LOCALIZATION = new Localization();
