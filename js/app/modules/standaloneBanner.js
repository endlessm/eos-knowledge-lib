// Copyright 2016 Endless Mobile, Inc.

/* exported StandaloneBanner */

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const OPEN_MAGAZINE_RESPONSE = 1;

/**
 * Class: StandaloneBanner
 * The banner at the top of the standalone page
 */
const StandaloneBanner = new Module.Class({
    Name: 'StandaloneBanner',
    GTypeName: 'EknStandaloneBanner',
    CssName: 'EknStandaloneBanner',
    Extends: Gtk.InfoBar,

    Properties: {
        /**
         * Property: title
         * Title of the app
         */
        'title': GObject.ParamSpec.string('title', 'Title', 'Title of the app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: background-image-uri
         * A URI to the background image for the banner
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'The background image of this page.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: title-image-uri
         * A URI to the title image
         */
        'title-image-uri': GObject.ParamSpec.string('title-image-uri',
            'Title image URI', 'A URI to the title image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/standaloneBanner.ui',
    InternalChildren: [ 'archive-label', 'button', 'button-label',
        'infobar-content-area' ],

    _init: function (props={}) {
        this.parent(props);

        this._title_image = new ImagePreviewer.ImagePreviewer({
            valign: Gtk.Align.START,
            vexpand: true,
            max_fraction: 0.5,
        });
        if (this.title_image_uri) {
            let file = Gio.File.new_for_uri(this.title_image_uri);
            file.read_async(GLib.PRIORITY_DEFAULT, null, (file, res) => {
                let stream = file.read_finish(res);
                this._title_image.set_content(stream);
            });
        }
        this._infobar_content_area.add(this._title_image);
        // title image is packed after the autoconstructed widgets, but it needs
        // to be first
        this._infobar_content_area.reorder_child(this._title_image, 0);

        this._archive_label.label = _("This article is part of the archive of the magazine %s.").format(this.title);
        /* 1014 = 0.99 px * 1024 Pango units / px */
        this._button_label.label = ('<span letter_spacing="1014">' +
            _("Open the magazine").toLocaleUpperCase() + '</span>');
        Utils.set_hand_cursor_on_widget(this._button);

        if (this.background_image_uri) {
            let frame_css = '* { background-image: url("' + this.background_image_uri + '"); background-size: cover; background-position: center;}';
            Utils.apply_css_to_widget(frame_css, this);
        }
    },

    on_response: function (response_id) {
        if (response_id !== OPEN_MAGAZINE_RESPONSE)
            return;
        Dispatcher.get_default().dispatch({
            action_type: Actions.LEAVE_PREVIEW_CLICKED,
        });
    },
});
