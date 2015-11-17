// Copyright 2015 Endless Mobile, Inc.

/* exported Card, MinSize, MaxSize */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const ImageCoverFrame = imports.app.widgets.imageCoverFrame;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

/**
 * Constants: MinSize
 * Minimum size of cards for each size class
 *
 * Members:
 *  A - Smallest possible size for cards
 *  B - Size B
 *  C - Size C
 *  D - Size D
 *  E - Size E
 *  F - Currently width-only
 *  G - Currently width-only
 *  H - Currently width-only
 */
const MinSize = {
    A: 100,
    B: 200,
    C: 300,
    D: 400,
    E: 600,
    F: 800,
    G: 1000,
    H: 1200,
};

/**
 * Constants: MaxSize
 * Maximum size of a card for each size class
 *
 * Members:
 *  A - Size A
 *  B - Size B
 *  C - Size C
 *  D - Size D
 *  E - This is the largest height class that a card will currently get.
 *      Even cards that are taller than this will still get class E.
 *  F - Currently width-only
 *  G - Currently width-only
 *  H - Currently width-only.
 *      Even cards that are wider than this will still get class H.
 */
const MaxSize = {
    A: MinSize.B - 1,
    B: MinSize.C - 1,
    C: MinSize.D - 1,
    D: MinSize.E - 1,
    E: MinSize.F - 1,
    F: MinSize.G - 1,
    G: MinSize.H - 1,
    H: 1399,
};

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
    Requires: [ Gtk.Widget, Module.Module ],

    Properties: {
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
    NUM_STYLE_VARIANTS: 3,

    /**
     * Method: set_label_or_hide
     *
     * Sets a label contents and hides if contents is empty.
     */
    set_label_or_hide: function (label, text) {
        label.label = GLib.markup_escape_text(text, -1);
        label.visible = !!text;
    },

    /**
     * Method: set_context_label_from_model
     *
     * Sets the text on a context label. The context is the list of tags
     * associated with this article. Tags are also incidentally the same
     * as set titles.
     *
     * According to designs (and based on what fits on screen), we only want
     * to show a maximum of two set titles in the context label.
     * Moreover, we want to exclude the 'Ekn'-prefixed tags which won't mean
     * anything to the user.
     */
    set_context_label_from_model: function (label) {
        this.set_label_or_hide(label,
                               this.model.tags.filter((tag) => !tag.startsWith('Ekn'))
                               .slice(0, 2)
                               .join(' | ')
                               .toLocaleUpperCase());
    },

    /**
     * Method: add_contextual_css_class
     *
     * Adds a css class based on the type of model this is.
     */
    add_contextual_css_class: function () {
        if (this.model instanceof SetObjectModel.SetObjectModel) {
            this.get_style_context().add_class(StyleClasses.SET);
        } else if (this.model instanceof ArticleObjectModel.ArticleObjectModel) {
            this.get_style_context().add_class(StyleClasses.ARTICLE);
        }
    },

    /**
     * Method: set_thumbnail_frame_from_model
     *
     * Sets up a frame to show the model's thumbnail uri.
     */
    set_thumbnail_frame_from_model: function (frame) {
        frame.visible = false;
        if (!this.model.thumbnail_uri)
            return;

        let scheme = Gio.File.new_for_uri(this.model.thumbnail_uri).get_uri_scheme();
        // FIXME: to actually support ekn uris here, we'd need a gvfs
        // extension or something like that
        if (scheme === 'ekn') {
            let coveredFrame = new ImageCoverFrame.ImageCoverFrame();
            Engine.get_default().get_object_by_id(this.model.thumbnail_uri, null, (engine, task) => {
                let media_object;
                try {
                    media_object = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error);
                    return;
                }

                coveredFrame.set_content(media_object.get_content_stream());
            });
            frame.add(coveredFrame);
        } else {
            let css_data = {
                'background-image': 'url("' + this.model.thumbnail_uri + '")',
                'background-repeat': 'no-repeat',
                'background-position': 'center',
                'background-size': 'cover',
            };
            let css_string = Utils.object_to_css_string(css_data);
            Utils.apply_css_to_widget(css_string, frame);
        }
        frame.visible = true;
    },

    /**
     * Method: set_title_label_from_model
     *
     * Sets up a label to show the model's title.
     */
    set_title_label_from_model: function (label) {
        this.set_label_or_hide(label,
            Utils.format_capitals(this.model.title, this.title_capitalization));
    },

    /**
     * Method: set_author_label_from_model
     *
     * Sets up a label to show the model's authors.
     */
    set_author_label_from_model: function (label) {
        this.set_label_or_hide(label, Utils.format_authors(this.model.authors));
    },

    /**
     * Method: set_style_variant_from_model
     * Uses the article number to set a style variant CSS class
     *
     * Adds one of the CSS classes 'variant0', 'variant1', or 'variant2' to the
     * card, depending on the <ArticleObjectModel.article_number> property if it
     * is present.
     */
    set_style_variant_from_model: function () {
        if (this.model.article_number !== undefined) {
            let style = this.model.article_number % this.NUM_STYLE_VARIANTS;
            this.get_style_context().add_class('variant' + style);
        }
    },

    /**
     * Method: update_card_sizing_classes
     * Assigns the appropriate CSS classes based on the height and width
     *
     * This method takes the height and width of the card widget and assigns the
     * appropriate CSS classes, according to our design constraints.
     */
    update_card_sizing_classes: function (height, width) {
        let width_class, height_class;

        if (width <= MaxSize.A) {
            width_class = StyleClasses.CARD_WIDTH.A;
        } else if (width <= MaxSize.B) {
            width_class = StyleClasses.CARD_WIDTH.B;
        } else if (width <= MaxSize.C) {
            width_class = StyleClasses.CARD_WIDTH.C;
        } else if (width <= MaxSize.D) {
            width_class = StyleClasses.CARD_WIDTH.D;
        } else if (width <= MaxSize.E) {
            width_class = StyleClasses.CARD_WIDTH.E;
        } else if (width <= MaxSize.F) {
            width_class = StyleClasses.CARD_WIDTH.F;
        } else if (width <= MaxSize.G) {
            width_class = StyleClasses.CARD_WIDTH.G;
        } else {
            width_class = StyleClasses.CARD_WIDTH.H;
        }

        if (height <= MaxSize.A) {
            height_class = StyleClasses.CARD_HEIGHT.A;
        } else if (height <= MaxSize.B) {
            height_class = StyleClasses.CARD_HEIGHT.B;
        } else if (height <= MaxSize.C) {
            height_class = StyleClasses.CARD_HEIGHT.C;
        } else if (height <= MaxSize.D) {
            height_class = StyleClasses.CARD_HEIGHT.D;
        } else {
            height_class = StyleClasses.CARD_HEIGHT.E;
        }

        let context = this.get_style_context();
        if (typeof width_class !== undefined && !context.has_class(width_class)) {
            Object.keys(StyleClasses.CARD_WIDTH).forEach(name => context.remove_class(StyleClasses.CARD_WIDTH[name]));
            context.add_class(width_class);
        }

        if (typeof width_class !== undefined && !context.has_class(height_class)) {
            Object.keys(StyleClasses.CARD_HEIGHT).forEach(name => context.remove_class(StyleClasses.CARD_HEIGHT[name]));
            context.add_class(height_class);
        }
    },

    /**
     * Method: fade_in
     * Use instead of *Gtk.Widget.show()* or *Gtk.Widget.show_all()*.
     */
    fade_in: function () {
        let context = this.get_style_context();
        context.add_class(StyleClasses.INVISIBLE);
        // FIXME: for some reason even if initial opacity = 0 in css, the
        // opacity will start at 1. Triggering a 'notify' on opacity seems to
        // get the actual initial opacity value in css to be respected
        this.opacity = 0;
        this.opacity = 1;
        // Cards not sensitive till fully faded in
        this.sensitive = false;
        Mainloop.timeout_add(this.FADE_IN_TIME_MS, () => {
            this.sensitive = true;
            context.remove_class(StyleClasses.INVISIBLE);
            context.remove_class(StyleClasses.FADE_IN);
            return GLib.SOURCE_REMOVE;
        });
        this.show();
        context.add_class(StyleClasses.FADE_IN);
    },
});
