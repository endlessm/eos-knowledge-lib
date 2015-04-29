// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Pango = imports.gi.Pango;

const CompositeButton = imports.app.compositeButton;
const Utils = imports.app.utils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        'fade-in': GObject.ParamSpec.boolean('fade-in', 'Fade in',
            'True if the card should fade in to being visible.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),

        /**
         * Property: featured
         * A boolean representing whether or not this card is "featured", and
         * should be treated as preferable to sibling cards. Defaults to false.
         */
        'featured': GObject.ParamSpec.boolean('featured', 'Featured',
            'Whether this card is featured',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, false),
    },

    _init: function(props) {
        this._title_label = new Gtk.Label({
            hexpand: true,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
            visible: false,
            no_show_all: true
        });
        this._synopsis_label = new Gtk.Label({
            hexpand: true,
            ellipsize: Pango.EllipsizeMode.END,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            lines: 8,
            max_width_chars: 1,
            visible: false,
            no_show_all: true
        });
        this._image_frame = new Gtk.Frame({
            expand: true,
            visible: false,
            no_show_all: true
        });
        this._background_provider = new Gtk.CssProvider();
        this._thumbnail_uri = null;

        this.parent(props);

        this.setSensitiveChildren([this._title_label, this._synopsis_label, this._image_frame]);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_TITLE);
        this._synopsis_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_SYNOPSIS);
        this._image_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_THUMBNAIL);
        if (this.fade_in) {
            // FIXME: for some reason even if initial opacity = 0 in css, the
            // opacity will start at 1. Triggering a 'notify' on opacity seems
            // to get the actual initial opacity value in css to be respected
            this.opacity = 0;
            this.opacity = 1;
            this.get_style_context().add_class('fade-in');
            // Cards not sensitive till fully faded in
            this.set_sensitive(false);
            Mainloop.timeout_add(1000, function () {
                this.set_sensitive(true);
                return false;
            }.bind(this));
        } else {
            this.get_style_context().add_class('visible');
        }

        Utils.set_hand_cursor_on_widget(this);

        this.pack_widgets(this._title_label, this._synopsis_label, this._image_frame);
        this.show_all();
    },

    /**
     * Method: pack_widgets
     *
     * A virtual function to be overridden by subclasses with custom looks,
     * _init will set up three widgets: title_label, synopsis_label and
     * image_frame for the title, synopsis, and thumbnail-uri properties.
     * These can be packed into any container widget you like. Add the final
     * widget tree to this button with this.add(). Implementation need not add
     * all widgets to the tree, if for example they do not want to support a
     * thumbnail image
     */
    pack_widgets: function (title_label, synopsis_label, image_frame) {
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(image_frame);
        grid.add(title_label);
        grid.add(synopsis_label);
        this.add(grid);
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
            let context = this._image_frame.get_style_context();
            context.add_provider(this._background_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        this._image_frame.visible = (v && v.length !== 0);
        this.notify('thumbnail-uri');
    },

    get thumbnail_uri () {
        if (this._thumbnail_uri)
            return this._thumbnail_uri;
        return '';
    }
});
