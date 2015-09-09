// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: PaperTemplate
 *
 * A template which displays the contents of its one slot as if it were printed on a sheet
 * of paper. The color or texture of the paper can be set with CSS, using
 * .paper-template .content as a selector.
 *
 * CSS Styles:
 *      paper-template - on the template as a whole, which is a GtkAlignment
 *      content - on the paper itself (the GtkFrame within the alignment)
 */
const PaperTemplate = new Lang.Class({
    Name: 'PaperTemplate',
    GTypeName: 'EknPaperTemplate',
    Extends: Gtk.Alignment,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/paperTemplate.ui',
    InternalChildren: [ 'content-frame' ],

    _init: function (props={}) {
        this.parent(props);
    },

    pack_content_slot: function (props={}) {
        if (this._content) {
            this._content_frame.remove(this._content);
        }
        this._content = this.create_submodule('content', props);
        this._content_frame.add(this._content);
    },

    // FIXME: These getters allow for reaching into the internals
    // of this template, which enables the presenter to connect
    // to widgets lower down in the widget hierarchy, e.g. the
    // search box. We can remove this when the encyclopedia app
    // becomes dispatchified!
    get content () {
        return this._content;
    },
});
