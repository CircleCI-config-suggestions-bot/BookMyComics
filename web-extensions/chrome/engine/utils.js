/**
 *
 * The FrameFinder class is an utility class which finds a frame from the
 * web-extension based on the provided frame Definition.
 * All Frame definitions are static members of the class, and this serves as a
 * central point to reference all frames handled by the web extension.
 *
 * @class
 */
function FrameFinder() {
}

FrameFinder.definitions = {
    SIDEPANEL: {
        id: 'BmcSidePanel',
        inspect: frame => !!(frame.showHideSidePanel),
    },
};

/**
 * This static method returns the first frame matching the provided frame
 * Definition object (which should be one of the frameDefinitions owned by the
 * class).
 *
 * @param {Object} frameDef - the frame Definition as definied by FrameFinder
 *                            class
 *
 * @return {Frame} the DOM frame object matching the definition provided
 */
FrameFinder.findWindow = function(frameDef) {
    if (!frameDef) {
        // Actually, not providing a frameDef is a developer error (not
        // supposed to happen). As such, we expect testing to cover this, and
        // in the worst case want to make it extra clear/visible to a used to
        // report the issue to the developers
        alert(LOCALIZATION.getString('S35'));
    }

    if (window === window.top) {
        // if we're in the top window, CORS will prevent introspecting the
        // webext-owned frames, but we know the frame's ID
        if (frameDef.id) {
            LOGS.log('S36');
            return document.getElementById(frameDef.id).contentWindow;
        }
    } else {
        // if we're not in the top window, then we're in a webext-owned frame,
        // which should allow us to introspect our own frames, and find the
        // sidepanel's
        for (var i = 0; i < window.parent.length; ++i) {
            let frame = window.parent.frames[i];
            try {
                if (frameDef.inspect && frameDef.inspect(frame)) {
                    LOGS.log('S37');
                    return frame;
                }
            } catch(e) {
                // Browser prevented us from inspecting the frame
                // -> CORS kicked in OR no 'inspect' method available
                // => This is not a same-domain frame (spawned by the BMC
                // webext), and thus not a framegq we can make use of.
                continue ;
            }
        }
    }
    alert(LOCALIZATION.getString('S38', {'data': JSON.stringify(frameDef)}));
    return null;
};
