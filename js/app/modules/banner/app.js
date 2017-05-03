// Copyright 2014 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
// Make sure included for glade template
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

const TITLE_IMAGE_URI = 'resource:///app/assets/titleImage';

/**
 * Class: App
 *
 * A module for the application's logo.
 *
 * CSS classes:
 *   app-banner - on the module itself
 *   subtitle - on the label displaying the app's subtitle
 */
const App = new Module.Class({
    Name: 'Banner.App',
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

    Template: 'resource:///com/endlessm/knowledge/data/widgets/banner/app.ui',
    InternalChildren: [ 'subtitle-label' ],

    _init: function (props={}) {
        // We don't want the module to autoexpand, but it will unless explicitly
        // forced not to because logo child has expand=true set.
        props.expand = props.expand || false;
        this.parent(props);

        let file = Gio.File.new_for_uri(TITLE_IMAGE_URI);
        if (file.query_exists(null)) {
            let image = new ThemeableImage.ThemeableImage({
                visible: true,
                image_uri: TITLE_IMAGE_URI,
            });
            this.attach(image, 0, 0, 1, 1);
        }

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
