/* exported ContentGroup */

// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const Overflow = imports.app.modules.arrangement.overflow;
const Utils = imports.app.utils;

const BATCH_SIZE = 10;

const CONTENT_PAGE_NAME = 'content';
const SPINNER_PAGE_NAME = 'spinner';
const NO_RESULTS_PAGE_NAME = 'no-results';

const ContentGroup = new Module.Class({
    Name: 'ContentGroup.ContentGroup',
    Extends: Gtk.Grid,

    Slots: {
        'arrangement': {},
        'selection': {},
        'title': {},
        'trigger': {},
        'no-results': {},  // optional
    },

    Properties: {
        /**
         * Property: has-more-content
         * Whether this content group has more content to show
         */
        'has-more-content': GObject.ParamSpec.boolean('has-more-content',
            'Has more content', 'Has more content',
            GObject.ParamFlags.READABLE),
    },

    _init: function (props={}) {
        this.parent(props);
        this._load_callback = null;

        this._title = this.create_submodule('title');
        if (this._title) {
            // You can't have a trigger without a title
            this._trigger = this.create_submodule('trigger');
            if (this._trigger) {
                // Title is clickable if and only if trigger exists
                let [title_button, trigger_button] = [this._title, this._trigger].map((module) => {
                    let button = new Gtk.Button({
                        halign: module.halign,
                    });

                    button.add(module);
                    Utils.set_hand_cursor_on_widget(button);
                    button.connect('clicked', () => this._selection.show_more());
                    return button;
                });

                // Style class needs to go on the button itself, so that we get :hover states and the like.
                title_button.get_style_context().add_class(Utils.get_element_style_class(ContentGroup, 'title'));
                trigger_button.get_style_context().add_class(Utils.get_element_style_class(ContentGroup, 'trigger'));
                this.attach(title_button, 0, 0, 1, 1);
                this.attach(trigger_button, 1, 0, 1, 1);
            } else {
                this._title.get_style_context().add_class(Utils.get_element_style_class(ContentGroup, 'title'));
                this.attach(this._title, 0, 0, 1, 1);
            }
        }

        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._selection.get_models(),
            });
        });

        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.connect('need-more-content', () => {
                if (this._selection.can_load_more)
                    this._selection.queue_load_more(BATCH_SIZE);
            });
        }

        this._no_results = this.create_submodule('no-results');

        // FIXME: use a composite template for this. Currently not possible
        // because Card.ContentGroup must inherit from this class.
        // https://bugzilla.gnome.org/show_bug.cgi?id=768790
        let builder = Gtk.Builder.new_from_resource('/com/endlessm/knowledge/data/widgets/contentGroup/contentGroup.ui');
        this._stack = builder.get_object('stack');
        let spinner = builder.get_object('spinner');
        this._stack.add_named(this._arrangement, CONTENT_PAGE_NAME);

        if (this._no_results)
            this._stack.add_named(this._no_results, NO_RESULTS_PAGE_NAME);

        // When the spinner is not being shown on screen, set it to
        // be inactive to help with performance.
        this._stack.connect('notify::visible-child', () => {
            spinner.active = this._stack.visible_child_name === SPINNER_PAGE_NAME;
        });
        this._selection = this.create_submodule('selection', {
            model: this.model || null,
        });
        this._selection.connect('models-changed',
            this._on_models_changed.bind(this));
        this._selection.connect('notify::loading', () => {
            this._stack.visible_child_name = this._selection.loading ? SPINNER_PAGE_NAME : CONTENT_PAGE_NAME;
        });

        this.attach(this._stack, 0, 1, 2, 1);

        [[this._selection, 'can-load-more'], [this._arrangement, 'all-visible']].forEach((arr) => {
            let obj = arr[0];
            let property = arr[1];
            obj.connect('notify::' + property, () => {
                this.notify('has-more-content');
            });
        });

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
    },

    get has_more_content () {
        return (!this._arrangement.all_visible || this._selection.can_load_more);
    },

    make_ready: function (cb=function () {}) {
        this._arrangement.clear();
        this._selection.clear();

        [this._title, this._trigger, this._no_results].forEach((module) => {
            if (module)
                module.make_ready();
        });
        this._load_callback = cb;
        this.load();
    },

    get_selection: function () {
        return this._selection;
    },

    _on_models_changed: function () {
        let models = this._selection.get_models();
        if (models.length === 0 && this._no_results) {
            this._stack.visible_child_name = NO_RESULTS_PAGE_NAME;
        } else {
            let max_cards = this._arrangement.get_max_cards();
            if (max_cards > -1)
                models.splice(max_cards);
            this._arrangement.set_models(models);
            let item = HistoryStore.get_default().get_current_item();
            if (item && item.model) {
                this._arrangement.highlight(item.model);
            }
            this._stack.visible_child_name = CONTENT_PAGE_NAME;
        }

        // If this is the first time models are loaded, invoke the callback
        if (this._load_callback) {
            this._load_callback();
            this._load_callback = null;
        }

        if (models.length > 0 && this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.new_content_added();
        }
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.query)
            this._arrangement.highlight_string(item.query);
    },

    load: function () {
        this._selection.clear();
        let cards_to_load = BATCH_SIZE;
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            cards_to_load = max_cards;
        this._selection.queue_load_more(cards_to_load);
    },
});
