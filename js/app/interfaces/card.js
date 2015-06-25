// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ContentObjectModel = imports.search.contentObjectModel;
const Utils = imports.app.utils;

/**
 * Interface: Card
 * Interface for card modules
 *
 * Requires:
 *   Gtk.Widget
 */
const Card = new Lang.Interface({
    Name: 'Card',
    GTypeName: 'EknCard',
    Requires: [ Gtk.Widget ],

    Properties: {
        'css': GObject.ParamSpec.string('css', 'CSS rules',
            'CSS rules to be applied to this widget',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        'fade-in': GObject.ParamSpec.boolean('fade-in', 'Fade in',
            'Whether the card should fade in to being visible.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: model
         * Record backing this card
         *
         * Every card is backed by a record in the database.
         * A card's record is represented by a <ContentObjectModel> or one of
         * its subclasses.
         *
         * Type:
         *   <ContentObjectModel>
         *
         * Flags:
         *   Construct only
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Card model with which to create this card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ContentObjectModel.ContentObjectModel),
        /**
         * Property: title-capitalization
         * Manner in which the card's title is formatted
         *
         * This property is a temporary stand-in for achieving this via the CSS
         * *text-transform* property.
         */
        'title-capitalization': GObject.ParamSpec.enum('title-capitalization',
            'Title capitalization', 'Manner in which the title is formatted',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            EosKnowledgePrivate.TextTransformType,
            EosKnowledgePrivate.TextTransform.NONE),
    },

    set css (v) {
        if (this._css === v)
            return;
        this._css = v;
        if (this._css) {
            Utils.apply_css_to_widget(this._css, this);
        }
        this.notify('css');
    },

    get css () {
        if (this._css)
            return this._css;
        return '';
    },

    // Overridable in tests; otherwise keep synchronized with the CSS
    FADE_IN_TIME_MS: 1000,

    /**
     * Property: authors_label
     * Optional *Gtk.Label* displaying the <ArticleObjectModel.authors> as a
     * formatted string
     */

    /**
     * Property: image_frame
     * Optional *Gtk.Frame* displaying the <ContentObjectModel.thumbnail-uri> as
     * an image
     */

    /**
     * Property: title_label
     * Optional *Gtk.Label* displaying the <ContentObjectModel.title>
     */

    /**
     * Property: synopsis_label
     * Optional *Gtk.Label* displaying the <ContentObjectModel.synopsis>
     */

    /**
     * Method: populate_from_model
     * Construct the card's UI based on its <Card.model>
     *
     * A card displays widgets based on what fields are available in its record.
     * This method should be called in the card's constructor to render the UI
     * based on the record that is passed to the <Card.model> construct
     * property.
     *
     * This method accesses certain widgets that may or may not be present on
     * any particular card.
     * For example, if the record has a "title" field, then this method will
     * look for a <Card.title_label> property.
     * If this card class does not have one, then the record's title will not be
     * displayed and the <Card.title_label> widget will be set to invisible.
     */
    populate_from_model: function () {
        if (!this.model)
            return;

        if (this.authors_label) {
            this.authors_label.no_show_all = true;
            this.authors_label.label = Utils.format_authors(this.model.authors);
            this.authors_label.visible = !!this.model.authors;
        }

        if (this.image_frame) {
            this.image_frame.no_show_all = true;
            if (this.model.thumbnail_uri) {
                let frame_css = '* { background-image: url("' + this.model.thumbnail_uri + '"); }';
                if (!this._background_provider) {
                    this._background_provider = new Gtk.CssProvider();
                    let context = this.image_frame.get_style_context();
                    context.add_provider(this._background_provider,
                        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
                }
                this._background_provider.load_from_data(frame_css);
            }
            this.image_frame.visible = !!this.model.thumbnail_uri;
        }

        if (this.synopsis_label) {
            this.title_label.no_show_all = true;
            this.synopsis_label.label = this.model.synopsis;
            this.synopsis_label.visible = !!this.model.synopsis;
        }

        if (this.title_label) {
            this.title_label.no_show_all = true;
            this.title_label.label = Utils.format_capitals(this.model.title,
                this.title_capitalization);
            this.title_label.visible = !!this.model.title;
        }
    },

    /**
     * Method: show_all
     * Overrides *Gtk.Widget.show_all()*.
     */
    show_all: function () {
        if (this.fade_in) {
            this.get_style_context().add_class('fade-in');
            // Cards not sensitive till fully faded in
            this.sensitive = false;
            Mainloop.timeout_add(this.FADE_IN_TIME_MS, () => {
                this.sensitive = true;
                return GLib.SOURCE_REMOVE;
            });
        } else {
            this.get_style_context().add_class('visible');
        }
        Gtk.Widget.prototype.show_all.call(this);
    },
});
