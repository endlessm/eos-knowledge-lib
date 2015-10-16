// Copyright 2015 Endless Mobile, Inc.

/* exported StandalonePage */

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArchiveNotice = imports.app.widgets.archiveNotice;
const Config = imports.app.config;
const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Module = imports.app.interfaces.module;
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const OpenButton = new Lang.Class({
    Name: 'OpenButton',
    GTypeName: 'EknOpenButton',
    Extends: Gtk.Button,
    Properties: {
        /**
         * Property: label
         *
         * The label on the button
         */
        'label': GObject.ParamSpec.string('label', 'Button label',
            'The label on the button',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
    },

    _OPEN_ICON: '/com/endlessm/knowledge/images/reader/standalone_arrow.svg',

    _init: function (props={}) {
        let image = new Gtk.Image({
            resource: this._OPEN_ICON,
            visible: true,
        });

        let frame = new Gtk.Frame();

        this._label_text = '';
        this._label = new Gtk.Label({
            use_markup: true,
        });

        this.parent(props);

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

    set label(v) {
        if (this._label_text === v)
            return;
        this._label_text = v;
        /* 1014 = 0.99 px * 1024 Pango units / px */
        this._label.label = ('<span letter_spacing="1014">' +
            this._label_text.toLocaleUpperCase() + '</span>');
    },

    get label() {
        if (this._label_text)
            return this._label_text;
        return '';
    },
});

/**
 * Class: Reader.Banner
 * The banner at the top of the standalone page
 *
 */
const Banner = new Lang.Class({
    Name: 'Banner',
    GTypeName: 'EknReaderBanner',
    Extends: Gtk.InfoBar,
    Properties: {
        /**
         * Property: background-image-uri
         *
         * The background image uri for this page.
         * Gets set by the presenter.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'The background image of this page.',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: title-image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'title-image-uri': GObject.ParamSpec.string('title-image-uri', 'Page Title Image URI',
            'URI to the title image',
            GObject.ParamFlags.READWRITE, ''),

        /**
         * Property: archive-label
         *
         * The label to show that this is an archived article.
         * Read-only.
         */
        'archive-label': GObject.ParamSpec.object('archive-label',
            'Archive label', 'The label showing that the article is archived',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
    },

    _init: function (props={}) {
        props.expand = false;

        this.parent(props);

        this.archive_notice = new ArchiveNotice.ArchiveNotice({
            expand: true,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
        });

        this._title_image = new ImagePreviewer.ImagePreviewer({
            valign: Gtk.Align.START,
            vexpand: true,
            max_fraction: 0.5,
        });

        let button = new OpenButton({
            label: _("Open the magazine"),
        });
        Utils.set_hand_cursor_on_widget(button);

        this.add_action_widget(button, 1);
        this.get_content_area().add(this._title_image);
        this.get_content_area().add(this.archive_notice);
    },

    set title_image_uri (v) {
        if (this._title_image_uri === v || v.length === 0)
            return;

        let stream = Gio.File.new_for_uri(v).read(null);
        this._title_image.set_content(stream);

        this._title_image_uri = v;
        this.notify('title-image-uri');
    },

    get title_image_uri () {
        if (this._title_image_uri)
            return this._title_image_uri;
        return '';
    },

    get background_image_uri () {
        return this._background_image_uri;
    },

    set background_image_uri (v) {
        if (this._background_image_uri === v)
            return;

        this._background_image_uri = v;
        if (this._background_image_uri !== null) {
            let frame_css = '* { background-image: url("' + this._background_image_uri + '"); background-size: cover; background-position: center;}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
    },
});

/**
 * Class: Reader.StandalonePage
 * The article page of the reader app.
 *
 * FIXME: This is not a real module yet; it needs to be modularized.
 *
 * This page shows an article, title, attribution, and infobar.
 */
const StandalonePage = new Lang.Class({
    Name: 'StandalonePage',
    GTypeName: 'EknReaderStandalonePage',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],
    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: document-card
         *
         * The <Reader.ReaderDocumentCard> widget created by this widget in order to
         * show a standalone search result from the archive.
         * Read-only.
         */
        'document-card': GObject.ParamSpec.object('document-card',
            'Document card', 'The document card that shows a single article',
            GObject.ParamFlags.READWRITE,
            ReaderDocumentCard.ReaderDocumentCard.$gtype),

        /**
         * Property: infobar
         *
         * The infobar widget used to provide a button back to main app.
         * Read-only.
         */
        'infobar': GObject.ParamSpec.object('infobar',
            'Infobar', 'The widget to show that this is an archived article during global search',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),

        /**
         * Property: title
         *
         * FIXME: when the infobar is a proper module this can go away.
         */
        'title': GObject.ParamSpec.string('title', 'Title', 'Title',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: home-background-uri
         * URI of the home page background
         */
        'home-background-uri': GObject.ParamSpec.string('home-background-uri',
            'Home Background URI', 'Home Background URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),

        /**
         * Property: title-image-uri
         *
         * FIXME: when the infobar is a proper module this can go away.
         */
        'title-image-uri': GObject.ParamSpec.string('title-image-uri',
            'Title Image URI', 'Title Image URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (props) {
        props = props || {};
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this.infobar = new Banner();
        this.infobar.archive_notice.label = _("This article is part of the archive of the magazine %s.").format(this.title);
        this.infobar.title_image_uri = this.title_image_uri;
        this.infobar.background_image_uri = this.home_background_uri;

        this._document_card = null;

        this.add(this.infobar);
    },

    set document_card (v) {
        if (v === this._document_card)
            return;
        if (this._document_card) {
            this.remove(this._document_card);
            this._document_card = null;
        }
        this._document_card = v;
        if (this._document_card) {
            this.add(this._document_card);
            this.show_all();
        }
        this.notify('document-card');
    },

    get document_card () {
        return this._document_card;
    },
});
