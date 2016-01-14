// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Utils = imports.app.utils;

function _alignment_to_justification (align) {
    switch (align) {
        case Gtk.Align.FILL:
        case Gtk.Align.CENTER:
            return Gtk.Justification.CENTER;
        case Gtk.Align.START:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                Gtk.Justification.RIGHT : Gtk.Justification.LEFT;
        case Gtk.Align.END:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                Gtk.Justification.LEFT : Gtk.Justification.RIGHT;
    }
    return Gtk.Justification.CENTER;
}

/**
 * Class: AppBanner
 *
 * A module for the application's logo.
 *
 * CSS classes:
 *   app-banner - on the module itself
 *   subtitle - on the label displaying the app's subtitle
 */
const AppBanner = new Lang.Class({
    Name: 'AppBanner',
    GTypeName: 'EknAppBanner',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),

        /**
         * Property: image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'image-uri': GObject.ParamSpec.string('image-uri', 'Page Title Image URI',
            'URI to the title image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: show-subtitle
         * Whether to show an application subtitle underneath the image.
         * Subtitle will be taken from the desktop file description field.
         */
        'show-subtitle': GObject.ParamSpec.boolean('show-subtitle',
            'Show Subtitle', 'Show Subtitle',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: subtitle-capitalization
         * Manner in which the app's subtitle is formatted
         *
         * This property is a temporary stand-in for achieving this via the CSS
         * *text-transform* property.
         */
        'subtitle-capitalization': GObject.ParamSpec.enum('subtitle-capitalization',
            'Subtitle capitalization',
            'Manner in which the subtitle is formatted',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            EosKnowledgePrivate.TextTransformType,
            EosKnowledgePrivate.TextTransform.NONE),
        /**
         * Property: min-fraction
         * Delegates to <ImagePreviewer.min-fraction>
         *
         * Allows setting this property on the logo widget from the app.json.
         * It's construct only for simplicity.
         */
        'min-fraction': GObject.ParamSpec.float('min-fraction', 'Min fraction',
            'Min fraction of size to display the logo at',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0.0, 1.0, 0.0),

        /**
         * Property: max-fraction
         * Delegates to <ImagePreviewer.max-fraction>
         *
         * Allows setting this property on the logo widget from the app.json.
         * It's construct only for simplicity.
         */
        'max-fraction': GObject.ParamSpec.float('max-fraction', 'Max fraction',
            'Max fraction of size to display the logo at',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0.0, 1.0, 1.0),
    },

    // Note: The 50-px margin-start on the subtitle looks reasonable until we
    // get better instructions from design.
    Template: 'resource:///com/endlessm/knowledge/data/widgets/appBanner.ui',
    InternalChildren: [ 'subtitle-label' ],

    _init: function (props={}) {
        this.parent(props);

        this._logo = new ImagePreviewer.ImagePreviewer({
            visible: true,
            min_fraction: this.min_fraction,
            max_fraction: this.max_fraction,
            expand: true,
        });
        this.attach(this._logo, 0, 0, 1, 1);

        if (this.image_uri) {
            let stream = Gio.File.new_for_uri(this.image_uri).read(null);
            this._logo.set_content(stream);
        }

        let subtitle = Utils.get_desktop_app_info().get_description();
        if (this.show_subtitle && subtitle) {
            subtitle = Utils.format_capitals(subtitle, this.subtitle_capitalization);
            // 758 = 0.74 px * 1024 Pango units / px
            // FIXME: Should be achievable through CSS when we fix GTK
            this._subtitle_label.label = ('<span letter_spacing="758">' +
                GLib.markup_escape_text(subtitle, -1) + '</span>');
            this._subtitle_label.visible = !!this.subtitle;
            this._subtitle_label.justify = _alignment_to_justification(this.halign);
        }
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
