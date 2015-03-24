// Copyright 2015 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticlePage = imports.reader.articlePage;
const Config = imports.config;
const ImagePreviewer = imports.imagePreviewer;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const ArchiveLabel = new Lang.Class({
    Name: 'ArchiveLabel',
    GTypeName: 'EknArchiveLabel',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: label
         *
         */
        'label': GObject.ParamSpec.string('label', 'Label',
            'Label',
            GObject.ParamFlags.READABLE, ''),
    },

    _ARCHIVE_ICON: '/com/endlessm/knowledge/reader/archive.svg',

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.column_spacing = 8;
        this.parent(props);

        let archive_icon = new Gtk.Image({
            resource: this._ARCHIVE_ICON,
            visible: true,
        });

        this._archive_label_text = '';
        this._archive_label = new Gtk.Label();
        this.add(archive_icon);
        this.add(this._archive_label);
    },

    set label (v) {
        if (this._archive_label_text === v)
            return;

        this._archive_label_text = v;
        this._archive_label.label = this._archive_label_text;
        this.notify('label');
    },

    get label () {
        if (this._archive_label_text)
            return this._archive_label_text;
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

        this.archive_label = new ArchiveLabel({
            expand: true,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
        });

        this._title_image = new ImagePreviewer.ImagePreviewer({
            valign: Gtk.Align.START,
            vexpand: true,
        });

        let button = this.add_button(_("OPEN THE MAGAZINE"), 1);
        button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_OPEN_BUTTON);
        this.get_content_area().add(this._title_image);
        this.get_content_area().add(this.archive_label);
    },

    set title_image_uri (v) {
        if (this._title_image_uri === v)
            return;

        this._title_image.file = Gio.File.new_for_uri(v);

        // only actually set the image URI if we successfully set the image
        this._title_image.set_max_percentage(0.5);
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
 * This page shows an article, title, attribution, and infobar.
 */
const StandalonePage = new Lang.Class({
    Name: 'StandalonePage',
    GTypeName: 'EknReaderStandalonePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: article-page
         *
         * The <Reader.ArticlePage> widget created by this widget in order to
         * show a standalone search result from the archive.
         * Read-only.
         */
        'article-page': GObject.ParamSpec.object('article-page',
            'Standalone page', 'The page that shows a single article',
            GObject.ParamFlags.READABLE,
            ArticlePage.ArticlePage.$gtype),

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
         * Property: archive-notice
         *
         * The widget used to provide a button back to main app.
         * Read-only.
         */
        'archive-notice': GObject.ParamSpec.object('archive-notice',
            'Archive notice', 'The widget to show that this is an archived article in in-app use',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),

        /**
         * Property: app-name
         *
         * The name/title of the application. Shown in the banner.
         */
        'app-name': GObject.ParamSpec.string('app-name', 'Application name',
            'The name of this reader application',
            GObject.ParamFlags.READABLE, ''),
    },

    _init: function (props) {
        props = props || {};
        props.orientation = Gtk.Orientation.VERTICAL;

        this.parent(props);

        this.article_page = new ArticlePage.ArticlePage();
        this.infobar = new Banner();

        this.archive_label = new ArchiveLabel();
        this.archive_notice = new Gtk.Frame({
            margin_top: 35,
            margin_bottom: 10,
            halign: Gtk.Align.CENTER,
        });
        this.archive_notice.add(this.archive_label);
        this.archive_notice.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ARCHIVE_LABEL);
        this.add(this.archive_notice);
        this.add(this.infobar);
        this.add(this.article_page);
    },

    set app_name (v) {
        if (this._app_name === v)
            return;
        this._app_name = v;
        let message = _("This article is part of the archive of the magazine ") + this._app_name;
        this.archive_label.label = message;
        this.infobar.archive_label.label = message;
        this.notify('app-name');
    },

    get app_name () {
        if (this._app_name)
            return this._app_name;
        return '';
    },
});
