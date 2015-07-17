// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArchiveNotice = new Lang.Class({
    Name: 'ArchiveNotice',
    GTypeName: 'EknArchiveNotice',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: label
         *
         */
        'label': GObject.ParamSpec.string('label', 'Label',
            'Label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    _init: function (props={}) {
        this._archive_label_text = '';
        this.parent(props);
        this.bind_property('label', this._archive_label, 'label', GObject.BindingFlags.SYNC_CREATE);
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/archiveNotice.ui',
    InternalChildren: [ 'archive-label', 'archive-icon' ],

    set label (v) {
        if (this._archive_label_text === v)
            return;

        this._archive_label_text = v;
        this.notify('label');
    },

    get label () {
        if (this._archive_label_text)
            return this._archive_label_text;
        return '';
    },
});
