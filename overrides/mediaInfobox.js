const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const EosKnowledge = imports.gi.EosKnowledge;
const Lang = imports.lang;

/** Class: MediaInfobox
 *
 * A widget to be used as a #EknLightbox infobox for a #EknMediaObjectModel. It
 * has labels set by <caption>, <license-text>, and <creator-text>.
 */
const MediaInfobox = new Lang.Class({
    Name: 'MediaInfobox',
    GTypeName: 'EknMediaInfobox',
    Extends: Gtk.Grid,
    
    LICENSE_PREAMBLE: 'License: ',
    CREATOR_PREAMBLE: 'Created By: ',

    Properties: {
        /**
         * Property: caption
         *
         * Main textual component for the lightbox infobox
         */
        'caption': GObject.ParamSpec.string('caption', 'Caption',
            'Caption to be displayed for the media',
            GObject.ParamFlags.READWRITE,
            ''),

        /**
         * Property: license-text
         *
         * Textual name of the license under which the media is released. For
         * example: "Creative Commons Attribution Share-Alike V2.5"
         */
        'license-text': GObject.ParamSpec.string('license-text', 'License text',
            'The name of the license to be displayed',
            GObject.ParamFlags.READWRITE,
            ''),

        /**
         * Property: creator-text
         *
         * Name of the attributable creator of the content
         */
        'creator-text': GObject.ParamSpec.string('creator-text', 'Creator text',
            'A name denoting the attributable content creator',
            GObject.ParamFlags.READWRITE,
            '')
    },

    _init: function (props) {
        props = props || {};
        props.column_homogeneous = true;

        this._caption = null;
        this._license_text = null;
        this._creator_text = null;

        this._caption_label = new Gtk.Label();
        this._license_label = new Gtk.Label({
            xalign: 0
        });
        this._creator_label = new Gtk.Label({
            xalign: 1
        });

        this.parent(props);

        this._caption_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX_CAPTION);
        this._license_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX_LICENSE_TEXT);
        this._creator_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX_CREATOR_TEXT);

        this.pack_widgets();
        this.show_all();
    },

    pack_widgets: function () {
        this.attach(this._caption_label, 0, 0, 2, 1);
        this.attach(this._license_label, 0, 1, 1, 1);
        this.attach(this._creator_label, 1, 1, 1, 1);
    },

    set caption (v) {
        if (this._caption === v) return;
        if (v.length > 0) {
            this._caption_label.label = v;
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
        if (v.length > 0) {
            this._license_label.label = this.LICENSE_PREAMBLE + v;
            this._license_label.show();
        } else {
            this._license_label.hide();
        }
        this._license_text = v;
    },
    
    get license_text () {
        if (this._license_text === null)
            return '';
        return this._license_text;
    },

    set creator_text (v) {
        if (this._creator_text === v) return;
        if (v.length > 0) {
            this._creator_label.label = this.CREATOR_PREAMBLE + v;
            this._creator_label.show();
        } else {
            this._creator_label.hide();
        }
        this._creator_text = v;
    },
    
    get creator_text () {
        if (this._creator_text === null)
            return '';
        return this._creator_text;
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
