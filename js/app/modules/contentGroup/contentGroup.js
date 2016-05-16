/* exported ContentGroup */

// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

const BATCH_SIZE = 15;

const CONTENT_PAGE_NAME = 'content';
const SPINNER_PAGE_NAME = 'spinner';

const ContentGroup = new Module.Class({
    Name: 'ContentGroup',
    CssName: 'content-group',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: title
         * Title of this content group
         */
        'title': GObject.ParamSpec.string('title',
            'Title', 'Title of this content group',
            GObject.ParamFlags.READWRITE, ''),
    },
    Slots: {
        'arrangement': {},
    },
    References: {
        'collection': {},
    },

    _init: function (props={}) {
        this._title = new Gtk.Label({
            halign: Gtk.Align.START,
        });
        this._title.get_style_context().add_class('title');

        // The title originally set via the app.json is a format string.
        // For static titles, simply set the title directly, and no string
        // substitution will take place. For dynamic titles, include a '%s'
        // somewhere in the string where you want the collections title
        // to be substituted, e.g. "More news from %s", will become
        // "More news from Politics" (assuming your collection is a set collection)
        // and the current set is Politics.
        this._format_string = props.title || '%s';
        delete props['title'];
        this.parent(props);

        this.attach(this._title, 0, 0, 1, 1);
        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._collection.get_models(),
            });
        });

        let stack = new Gtk.Stack();
        let spinner = new Gtk.Spinner();
        stack.add_named(spinner, SPINNER_PAGE_NAME);
        stack.add_named(this._arrangement, CONTENT_PAGE_NAME);

        // When the spinner is not being shown on screen, set it to
        // be inactive to help with performance.
        stack.connect('notify::visible-child', () => {
            spinner.active = stack.visible_child_name === SPINNER_PAGE_NAME;
        });

        this.reference_module('collection', (collection) => {
            this._collection = collection;
            this._collection.connect('models-changed',
                this._on_models_changed.bind(this));
            this._collection.connect('notify::loading', () => {
                stack.visible_child_name = this._collection.loading ? SPINNER_PAGE_NAME : CONTENT_PAGE_NAME;
            });

            // If we don't have a static title set from the app.json,
            // then let's use the collection's title as the title for
            // this content group.
            if (!this._title_label) {
                this._collection.bind_property('title',
                    this, 'title',
                    GObject.BindingFlags.DEFAULT);
            }
        });

        this.attach(stack, 0, 1, 1, 1);
    },

    _on_models_changed: function () {
        let models = this._collection.get_models();
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            models.splice(max_cards);
        this._arrangement.set_models(models);
    },

    load: function () {
        let cards_to_load = BATCH_SIZE;
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            cards_to_load = max_cards;
        this._collection.load_more(cards_to_load);
    },

    set title (v) {
        let formatted_v = this._format_string.format(v);
        if (this._title_label === formatted_v)
            return;
        this._title_label = formatted_v;
        this._title.label = this._title_label;
        this._title.visible = !!this._title_label;
        this.notify('title');
    },

    get title () {
        if (this._title_label)
            return this._title_label;
        return '';
    },
});
