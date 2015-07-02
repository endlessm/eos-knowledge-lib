const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

/** Class: MediaInfobox
 *
 * A widget to be used as a #EknLightbox infobox for a #EknMediaObjectModel. It
 * has labels set by <caption>, <license-text>, and <creator-text>.
 */
const MediaInfobox = new Lang.Class({
    Name: 'MediaInfobox',
    GTypeName: 'EknMediaInfobox',
    Extends: Gtk.Grid,
    
    Properties: {
        /**
         * Property: caption
         *
         * Main textual component for the lightbox infobox
         */
        'caption': GObject.ParamSpec.string('caption', 'Caption',
            'Caption to be displayed for the media',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         *
         */
        'media-title': GObject.ParamSpec.string('media-title', 'Media Title',
            'Title of the media being displayed',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: license-text
         *
         * Textual name of the license under which the media is released. For
         * example: "Creative Commons Attribution Share-Alike V2.5"
         */
        'license-text': GObject.ParamSpec.string('license-text', 'License text',
            'The name of the license to be displayed',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: creator-text
         *
         * Name of the attributable creator of the content
         */
        'creator-text': GObject.ParamSpec.string('creator-text', 'Creator text',
            'A name denoting the attributable content creator',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            '')
    },

    _MAX_CAPTION_LINES: 5,

    _css_has_loaded: false,

    _init: function (props) {
        props = props || {};
        props.orientation = Gtk.Orientation.VERTICAL;

        this._caption_label = new Gtk.Label({
            xalign: 0,
            wrap: true,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END,
            lines: this._MAX_CAPTION_LINES
        });
        this._caption_label.get_style_context().add_class(StyleClasses.INFOBOX_CAPTION);

        this._separator = new Gtk.Separator({
            expand: true,
            halign: Gtk.Align.FILL
        });

        this._attribution_button = new Gtk.Button();
        this._attribution_label = new Gtk.Label({
            xalign: 0,
            wrap: true,
            wrap_mode: Pango.WrapMode.WORD_CHAR
        });
        this._attribution_button.get_style_context().add_class(StyleClasses.INFOBOX_ATTRIBUTION_TEXT);
        this._attribution_button.add(this._attribution_label);

        this.parent(props);

        if (!this._css_has_loaded) {
            let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/infobox.css');
            Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
            this._css_has_loaded = true;
        }

        this.add(this._caption_label);
        this.add(this._separator);
        this.add(this._attribution_button);
        this.show_all();
    },


    _refresh_attribution_label: function () {
        let attributions = [];
        if (this._media_title)
            attributions.push(this._media_title);
        if (this._license_text)
            attributions.push(this._license_text);
        if (this._creator_text)
            attributions.push(this._creator_text);
        this._attribution_label.label = attributions.map(function (s) {
            return s.split('\n')[0];
        }).join(' - ').toUpperCase();
    },

    set caption (v) {
        if (this._caption === v) return;
        if (v.length > 0) {
            // FIXME: We may want to stick this text content in a scroll
            // area of some sort, and keep newlines. But for now we remove
            // newlines so the label ellipsizing will work
            this._caption_label.label = v.split('\n').join(' ');
            this._caption_label.show();
        } else {
            this._caption_label.hide();
        }
        this._caption = v;
    },
    
    get caption () {
        if (this._caption === null)
            return '';
        return this._caption;
    },

    set license_text (v) {
        if (this._license_text === v) return;

        this._license_text = v;
        this._refresh_attribution_label();
    },
    
    get license_text () {
        if (this._license_text === null)
            return '';
        return this._license_text;
    },

    set creator_text (v) {
        if (this._creator_text === v) return;

        this._creator_text = v;
        this._refresh_attribution_label();
    },
    
    get creator_text () {
        if (this._creator_text === null)
            return '';
        return this._creator_text;
    },

    set media_title (v) {
        if (this._media_title === v) return;

        this._media_title = v;
        this._refresh_attribution_label();
    },

    get media_title () {
        if (this._media_title === null)
            return '';
        return this._media_title;
    }
});


/**
 * Constructor: new_from_ekn_model
 * Returns a new #MediaInfobox from a #ContentObjectModel with the relevant
 * properties set.
 */

MediaInfobox.new_from_ekn_model = function (model) {
    let props = {};

    if (typeof model.caption !== 'undefined') {
        props.caption = model.caption;
    }

    if (typeof model.license !== 'undefined') {
        props.license_text = model.license;
    }

    if (typeof model.copyright_holder !== 'undefined') {
        props.creator_text = model.copyright_holder;
    }

    return new MediaInfobox(props);
};
