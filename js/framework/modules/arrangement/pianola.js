// Copyright 2016 Endless Mobile, Inc.

/* exported Pianola */

const Module = imports.framework.interfaces.module;
const Piano = imports.framework.modules.arrangement.piano;

/**
 * Class: Pianola
 * Helper class to be used with Picard to show the "compact mode" of the Piano arrangement.
 *
 * As per design specifications, the Piano arrangement now has a "compact mode",
 * in which two support cards are shown regardless of the dimensions of the
 * arrangement. Behold, the Pianola!
 *
 * This helper class encapsulates this "compact mode" of the Piano arrangement,
 * and is meant to be invoked by our Picard tester application.
 * Under normal circumstances, it would be preferred to call the actual Piano
 * arrangement and pass the `compact-mode` property as needed.
 */
var Pianola = new Module.Class({
    Name: 'Arrangement.Pianola',
    Extends: Piano.Piano,

    _init: function (props={}) {
        props.compact_mode = true;
        this.parent(props);
    },
});
