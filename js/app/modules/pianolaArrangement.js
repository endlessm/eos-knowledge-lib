// Copyright 2016 Endless Mobile, Inc.

/* exported PianolaArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;
const PianoArrangement = imports.app.modules.pianoArrangement;

/**
 * Class: PianolaArrangement
 * Helper class to be used with Picard to show the "compact mode" of the Piano arrangement.
 *
 * As per design specifications, the PianoArrangement now has a "compact mode",
 * in which two support cards are shown regardless of the dimensions of the
 * arrangement. Behold, the PianolaArrangement!
 *
 * This helper class encapsulates this "compact mode" of the Piano arrangement,
 * and is meant to be invoked by our Picard tester application.
 * Under normal circumstances, it would be preferred to call the actual Piano
 * arrangement and pass the `compact-mode` property as needed.
 */
const PianolaArrangement = new Lang.Class({
    Name: 'PianolaArrangement',
    GTypeName: 'EknPianolaArrangement',
    Extends: PianoArrangement.PianoArrangement,

    _init: function (props={}) {
        props.compact_mode = true;
        this.parent(props);
    },
});
