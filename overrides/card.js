// Copyright 2014 Endless Mobile, Inc.

/* global _EosKnowledge */

const _Gtk = imports.gi.Gtk;
const _GObject = imports.gi.GObject;
const _Gio = imports.gi.Gio;
const _Gdk = imports.gi.Gdk;
const _Lang = imports.lang;

const _CompositeButton = imports.composite_button;

/**
 * Class: Card
 * Base class for topic cards in the knowledge app UI
 *
 * This widget displays a clickable topic to the user. Can be configured with
 * <title>, <subtitle> and <thumbnail-uri> properties. Connect to the <clicked>
 * signal to perform an action when the user clicks on the card.
 */

/**
 * Event: clicked
 * Signal generated when user clicked the card.
 * > card.connect("clicked", function (widget) { print("Clicked!"); });
 */
const Card = new _Lang.Class({
    Name: 'Card',
    GTypeName: 'EknCard',
    Extends: _CompositeButton.CompositeButton,
    Properties: {
        /**
         * Property: title
         * A string with the title of the card. Defaults to an empty string.
         */
        'title': _GObject.ParamSpec.string('title', 'Card Title',
            'Title of the card',
            _GObject.ParamFlags.READABLE | _GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: subtitle
         * A string with the subtitle of the card. Defaults to an empty string.
         */
        'subtitle': _GObject.ParamSpec.string('subtitle', 'Card Description',
            'Subtitle of the card',
            _GObject.ParamFlags.READABLE | _GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: thumbnail-uri
         * A string with the URI of the thumbnail image. An empty string means
         * no thumbnail should be visible. Defaults to an empty string.
         */
        'thumbnail-uri': _GObject.ParamSpec.string('thumbnail-uri', 'Thumbnail URI',
            'URI of the background image',
            _GObject.ParamFlags.READABLE | _GObject.ParamFlags.WRITABLE, '')
    },

    _init: function(params) {
        this._title_label = new _Gtk.Label();
        this._subtitle_label = new _Gtk.Label();
        this._frame = new _Gtk.Frame();
        this._background_provider = new _Gtk.CssProvider();
        this._thumbnail_uri = null;

        this.parent(params);

        let grid = new _Gtk.Grid({
            orientation: _Gtk.Orientation.VERTICAL
        });
        grid.add(this._frame);
        grid.add(this._title_label);
        grid.add(this._subtitle_label);

        this.add(grid);

        this.setSensitiveChildren([this._title_label, this._subtitle_label, this._frame]);

        this.get_style_context().add_class(_EosKnowledge.STYLE_CLASS_CARD);
        this._title_label.get_style_context().add_class(_EosKnowledge.STYLE_CLASS_TITLE);
        this._subtitle_label.get_style_context().add_class(_EosKnowledge.STYLE_CLASS_SUBTITLE);
        this._frame.get_style_context().add_class(_EosKnowledge.STYLE_CLASS_THUMBNAIL);
    },

    set title (v) {
        if (this._title_label.label === v) return;
        this._title_label.label = v;
        this.notify('title');
    },

    get title () {
        if (this._title_label)
            return this._title_label.label;
        return '';
    },

    set subtitle (v) {
        if (this._subtitle_label.label === v) return;
        this._subtitle_label.label = v;
        this.notify('subtitle');
    },

    get subtitle () {
        if (this._subtitle_label)
            return this._subtitle_label.label;
        return '';
    },

    set thumbnail_uri (v) {
        if (this._thumbnail_uri === v) return;
        this._thumbnail_uri = v;
        if (this._thumbnail_uri) {
            let frame_css = '* { background-image: url("' + this._thumbnail_uri + '"); }';
            this._background_provider.load_from_data(frame_css);
            let context = this._frame.get_style_context();
            context.add_provider(this._background_provider, _Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        this.notify('thumbnail-uri');
    },

    get thumbnail_uri () {
        if (this._thumbnail_uri)
            return this._thumbnail_uri;
        return '';
    },
});
