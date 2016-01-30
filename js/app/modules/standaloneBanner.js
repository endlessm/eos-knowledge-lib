// Copyright 2016 Endless Mobile, Inc.

/* exported StandaloneBanner */

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArchiveNotice = imports.app.widgets.archiveNotice;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const OPEN_MAGAZINE_RESPONSE = 1;

const OpenButton = new Lang.Class({
    Name: 'OpenButton',
    GTypeName: 'EknOpenButton',
    Extends: Gtk.Button,

    _OPEN_ICON: '/com/endlessm/knowledge/data/images/reader/standalone_arrow.svg',

    _init: function (props={}) {
        this.parent(props);

        let image = new Gtk.Image({
            resource: this._OPEN_ICON,
            visible: true,
        });
        let frame = new Gtk.Frame();
        this._label_text = '';
        this._label = new Gtk.Label({
            use_markup: true,
        });
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            column_spacing: 10,
        });
        frame.add(grid);
        grid.add(this._label);
        grid.add(image);
        this.add(frame);

        this.get_style_context().add_class(StyleClasses.READER_OPEN_BUTTON);
    },
});

/**
 * Class: StandaloneBanner
 * The banner at the top of the standalone page
 */
const StandaloneBanner = new Lang.Class({
    Name: 'StandaloneBanner',
    GTypeName: 'EknStandaloneBanner',
    Extends: Gtk.InfoBar,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
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

    _init: function (props={}) {
        props.vexpand = false;
        this.parent(props);

        this._archive_notice = new ArchiveNotice.ArchiveNotice({
            expand: true,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            label: _("This article is part of the archive of the magazine %s.").format(this.title),
        });

        this._title_image = new ImagePreviewer.ImagePreviewer({
            valign: Gtk.Align.START,
            vexpand: true,
            max_fraction: 0.5,
        });
        if (this.title_image_uri) {
            // FIXME sync
            let stream = Gio.File.new_for_uri(this.title_image_uri).read(null);
            this._title_image.set_content(stream);
        }

        let button = new OpenButton();
        /* 1014 = 0.99 px * 1024 Pango units / px */
        button._label.label = ('<span letter_spacing="1014">' +
            _("Open the magazine").toLocaleUpperCase() + '</span>');
        Utils.set_hand_cursor_on_widget(button);

        this.add_action_widget(button, OPEN_MAGAZINE_RESPONSE);
        let content_area = this.get_content_area();
        content_area.add(this._title_image);
        content_area.add(this._archive_notice);

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
