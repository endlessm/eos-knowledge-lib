// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const CompositeButton = imports.compositeButton;

/**
 * Class: Card
 * Base class for topic cards in the knowledge app UI
 *
 * This widget displays a clickable topic to the user. Can be configured with
 * <title>, <synopsis> and <thumbnail-uri> properties. Connect to the <clicked>
 * signal to perform an action when the user clicks on the card.
 */

/**
 * Event: clicked
 * Signal generated when user clicked the card.
 * > card.connect("clicked", function (widget) { print("Clicked!"); });
 */
const Card = new Lang.Class({
    Name: 'Card',
    GTypeName: 'EknCard',
    Extends: CompositeButton.CompositeButton,
    Properties: {
        /**
         * Property: title
         * A string with the title of the card. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Card Title',
            'Title of the card',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: synopsis
         * A string with the synopsis of the card. Defaults to an empty string.
         */
        'synopsis': GObject.ParamSpec.string('synopsis', 'Card Description',
            'synopsis of the card',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: thumbnail-uri
         * A string with the URI of the thumbnail image. An empty string means
         * no thumbnail should be visible. Defaults to an empty string.
         */
        'thumbnail-uri': GObject.ParamSpec.string('thumbnail-uri', 'Thumbnail URI',
            'URI of the background image',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')
    },

    CARD_WIDTH: 183,
    CARD_HEIGHT: 209,
    CARD_MARGIN: 7,

    _init: function(props) {
        props = props || {};
        props.expand = false;
        props.halign = Gtk.Align.START;

        this._title_label = new Gtk.Label({
            hexpand: true,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
            visible: false,
            no_show_all: true
        });
        this._synopsis_label = new Gtk.Label({
            hexpand: true,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
            visible: false,
            no_show_all: true
        });
        this._frame = new Gtk.Frame({
            expand: true,
            visible: false,
            no_show_all: true
        });
        this._background_provider = new Gtk.CssProvider();
        this._thumbnail_uri = null;

        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(this._frame);
        grid.add(this._title_label);
        grid.add(this._synopsis_label);

        this.add(grid);

        this.setSensitiveChildren([this._title_label, this._synopsis_label, this._frame]);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_TITLE);
        this._synopsis_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_SYNOPSIS);
        this._frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_THUMBNAIL);
    },

    // TODO: we do want all cards to be the same size, but we may want to make
    // this size scale with resolution down the road
    vfunc_get_preferred_width: function () {
        return [this.CARD_WIDTH + 2 * this.CARD_MARGIN, this.CARD_WIDTH + 2 * this.CARD_MARGIN];
    },

    vfunc_get_preferred_height: function () {
        return [this.CARD_HEIGHT + 2 * this.CARD_MARGIN, this.CARD_HEIGHT + 2 * this.CARD_MARGIN];
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    set title (v) {
        if (this._title_label.label === v) return;
        this._title_label.label = v;
        this._title_label.visible = (v && v.length !== 0);
        this.notify('title');
    },

    get title () {
        if (this._title_label)
            return this._title_label.label;
        return '';
    },

    set synopsis (v) {
        if (this._synopsis_label.label === v) return;
        this._synopsis_label.label = v;
        this._synopsis_label.visible = (v && v.length !== 0);
        this.notify('synopsis');
    },

    get synopsis () {
        if (this._synopsis_label)
            return this._synopsis_label.label;
        return '';
    },

    set thumbnail_uri (v) {
        if (this._thumbnail_uri === v) return;
        this._thumbnail_uri = v;
        if (this._thumbnail_uri) {
            let frame_css = '* { background-image: url("' + this._thumbnail_uri + '"); }';
            this._background_provider.load_from_data(frame_css);
            let context = this._frame.get_style_context();
            context.add_provider(this._background_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        this._frame.visible = (v && v.length !== 0);
        this.notify('thumbnail-uri');
    },

    get thumbnail_uri () {
        if (this._thumbnail_uri)
            return this._thumbnail_uri;
        return '';
    },
});
