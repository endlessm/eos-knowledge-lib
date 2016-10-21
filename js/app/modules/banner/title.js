// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: Title
 *
 * A module for the application's title.
 *
 */
const Title = new Module.Class({
    Name: 'Banner.Title',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: show-subtitle
         * Whether to show an application subtitle underneath the image.
         * Subtitle will be taken from the desktop file description field.
         */
        'show-subtitle': GObject.ParamSpec.boolean('show-subtitle',
            'Show Subtitle', 'Show Subtitle',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/banner/title.ui',
    InternalChildren: [ 'title-label', 'subtitle-label' ],

    _init: function (props={}) {
        this.parent(props);

        let app_info = Utils.get_desktop_app_info();

        let title = app_info.get_display_name();
        this._title_label.label = title;
        this._title_label.justify = Utils.alignment_to_justification(this.halign);

        let subtitle = app_info.get_description();
        if (this.show_subtitle && subtitle) {
            this._subtitle_label.label = subtitle;
            this._subtitle_label.justify = Utils.alignment_to_justification(this.halign);
        }
        this._subtitle_label.visible = this.show_subtitle;
    },

    set subtitle (value) {
        if (this._subtitle === value)
            return;
        this._subtitle = value;
        this.notify('subtitle');
    },

    get subtitle () {
        return this._subtitle || '';
    },
});
