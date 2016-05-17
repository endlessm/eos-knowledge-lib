// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Utils = imports.app.utils;

/**
 * Class: App
 *
 * A module for the application's logo.
 *
 * CSS classes:
 *   app-banner - on the module itself
 *   subtitle - on the label displaying the app's subtitle
 */
const App = new Module.Class({
    Name: 'AppBanner',
    CssName: 'EknAppBanner',
    Extends: Gtk.Grid,

    Properties: {
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

    Template: 'resource:///com/endlessm/knowledge/data/widgets/appBanner.ui',
    InternalChildren: [ 'subtitle-label' ],

    _init: function (props={}) {
        // We don't want the module to autoexpand, but it will unless explicitly
        // forced not to because logo child has expand=true set.
        props.expand = props.expand || false;
        this.parent(props);

        this._logo = new ImagePreviewer.ImagePreviewer({
            visible: true,
            min_fraction: this.min_fraction,
            max_fraction: this.max_fraction,
            expand: true,
            valign: Gtk.Align.END,
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
            this._subtitle_label.justify = Utils.alignment_to_justification(this.halign);
        }
        this._subtitle_label.visible = this.show_subtitle;
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
