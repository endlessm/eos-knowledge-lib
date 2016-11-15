// Copyright 2016 Endless Mobile, Inc.

/* exported Dynamic */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
// Make sure included for glade template
const DynamicLogo = imports.app.widgets.dynamicLogo;
const Utils = imports.app.utils;

/**
 * Class: Dynamic
 *
 * A module for the application's dynamic logo.
 *
 * CSS classes:
 *   logo - on the widget displaying the app's logo.
 *   subtitle - on the label displaying the app's subtitle
 */
const Dynamic = new Module.Class({
    Name: 'Banner.Dynamic',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: show-subtitle
         * Whether to show an application subtitle underneath the logo.
         * Subtitle will be taken from the desktop file description field.
         */
        'show-subtitle': GObject.ParamSpec.boolean('show-subtitle',
            'Show Subtitle', 'Show Subtitle',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
         /**
         * Property: mode
         *
         * The mode of the logo, it can be text, image or full.
         */
        'mode': GObject.ParamSpec.string('mode', 'mode', 'mode',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, 'text'),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/banner/dynamic.ui',
    InternalChildren: [ 'subtitle-label', 'logo' ],

    _init: function (props={}) {
        // We don't want the module to autoexpand, but it will unless explicitly
        // forced not to because logo child has expand=true set.
        props.expand = props.expand || false;
        this.parent(props);

        this._logo.mode = this.mode;
        if (this.mode !== 'text')
            this._logo.image_uri = 'resource:///app/assets/logo';

        let text = '';
        let app_info = Utils.get_desktop_app_info();
        if (app_info && app_info.get_name()) {
            text = app_info.get_name();
        }
        this._logo.text = text;

        let subtitle = '';
        let app_info = Utils.get_desktop_app_info();
        if (app_info) {
            subtitle = app_info.get_description();
        }
        if (this.show_subtitle && subtitle) {
            this._subtitle_label.label = subtitle;
            this._subtitle_label.justify = Utils.alignment_to_justification(this.halign);
        }
        this._subtitle_label.visible = this.show_subtitle;
    },

    set subtitle(value) {
        if (this._subtitle === value)
            return;
        this._subtitle = value;
        this.notify('subtitle');
    },

    get subtitle() {
        return this._subtitle || '';
    },
});
