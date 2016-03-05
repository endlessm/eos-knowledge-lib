// Copyright 2016 Endless Mobile, Inc.

/* exported CardContainer */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
String.prototype.format = Format.format;

/**
 * Class: CardContainer
 * A generic module for displaying cards in some sort of container. This class is
 * generally not used explicitly, but is subclassed by other modules wanting
 * to display cards.
 *
 * Slots:
 *   arrangement
 */
const CardContainer = new Lang.Class({
    Name: 'CardContainer',
    GTypeName: 'EknCardContainer',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: title
         * Title of this container
         */
        'title': GObject.ParamSpec.string('title',
            'Title', 'Title of this container',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: title-capitalization
         * Manner in which the title is formatted
         *
         * This property is a temporary stand-in for achieving this via the CSS
         * *text-transform* property.
         */
        'title-capitalization': GObject.ParamSpec.enum('title-capitalization',
            'Title capitalization', 'Manner in which the title is formatted',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            EosKnowledgePrivate.TextTransformType,
            EosKnowledgePrivate.TextTransform.NONE),
        /**
         * Property: show-trigger
         * Show a "trigger" at the top right for the user to view more
         *
         * Default:
         *   **true**
         */
        'show-trigger': GObject.ParamSpec.boolean('show-trigger', 'Show trigger',
            'Show a "trigger" at the top right for the user to view more',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    _init: function (props={}) {
        let image = new Gtk.Image({
            resource: '/com/endlessm/knowledge/data/images/right_arrow.svg',
        });
        this.title_button = new Gtk.Button({
            halign: Gtk.Align.START,
        });

        this.title_button.get_style_context().add_class(StyleClasses.CARD_TITLE);

        this.parent(props);

        let separator = new ThemeableImage.ThemeableImage({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
        });
        separator.get_style_context().add_class(Gtk.STYLE_CLASS_SEPARATOR);

        this.arrangement = this.create_submodule('arrangement');
        this.arrangement.connect('card-clicked', (arrangement, model) => {
            this.card_clicked(arrangement, model);
        });

        Utils.set_hand_cursor_on_widget(this.title_button);
        this.attach(this.title_button, 0, 0, 1, 1);
        this.attach(separator, 0, 1, 2, 1);
        this.attach(this.arrangement, 0, 2, 2, 1);

        if (this.show_trigger) {
            this.see_more_button = new Gtk.Button({
                halign:  Gtk.Align.END,
                hexpand:  true,
                always_show_image: true,
                image_position: Gtk.PositionType.RIGHT,
                image: image,
            });
            Utils.set_hand_cursor_on_widget(this.see_more_button);
            this.attach(this.see_more_button, 1, 0, 1, 1);
            this.arrangement.bind_property('all-visible',
                this.see_more_button, 'visible',
                GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.INVERT_BOOLEAN);
            this._update_title();
        }
        this.show_all();
    },

    _update_title: function () {
        this.title_button.label = Utils.format_capitals(this._title_label,
            this.title_capitalization);
        if (this.show_trigger && this.see_more_button) {
            // TRANSLATORS: %s will be replaced with the name of the category
            // that we are offering to show more of.
            this.see_more_button.label = _("See more %s").format(this._title_label);
        }
    },

    set title(v) {
        if (this._title_label === v)
            return;
        this._title_label = v;
        this._update_title();
    },

    get title() {
        if (this._title_label)
            return this._title_label;
        return '';
    },

    get title_capitalization() {
        return this._title_capitalization || EosKnowledgePrivate.TextTransform.NONE;
    },

    set title_capitalization(value) {
        if (this._title_capitalization === value)
            return;
        this._title_capitalization = value;
        this._update_title();
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement'];
    },

    /**
     * Method: card_clicked
     * To be overridden in subclasses
     *
     * Override this method if you want to influence the payload that is sent
     * when one of the arrangement's cards is clicked.
     * Normally this is <Actions.ITEM_CLICKED>.
     */
    card_clicked: function (arrangement, model) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
            context: this.arrangement.get_models(),
        });
    },
});
