/* exported ContentGroup */

// Copyright 2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Overflow = imports.app.modules.arrangement.overflow;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const CONTENT_PAGE_NAME = 'content';
const NO_RESULTS_PAGE_NAME = 'no-results';
const ERROR_PAGE_NAME = 'error';

/**
 * Class: ContentGroup
 */
const ContentGroup = new Module.Class({
    Name: 'ContentGroup.ContentGroup',
    Extends: Gtk.Grid,

    Slots: {
        'arrangement': {},
        'selection': {},
        'title': {}, // optional
        'trigger': {}, // optional
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
        /**
         * Property: paginate
         * Whether this content group should paginate content
         *
         * Use this property to turn on pagination. If this property is set,
         * a 'See more' button will appear at the bottom of the content group,
         * which will allow user to page in more results manually. The number
         * of results that get paged in on each click is determined by
         * cards-per-page
         */
        'paginate': GObject.ParamSpec.boolean('paginate',
            'Paginate', 'Whether to paginate content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: cards-per-page
         * Number of cards to be displayed per page
         */
        'cards-per-page': GObject.ParamSpec.uint('cards-per-page', 'Cards per page',
            'The number of cards to be displayed per page.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            1, GLib.MAXUINT16, 10),
    },

    _init: function (props={}) {
        this.parent(props);

        this._title = this.create_submodule('title');
        if (this._title) {
            // You can't have a trigger without a title
            this._trigger = this.create_submodule('trigger');
            if (this._trigger) {
                // Title is clickable if and only if trigger exists
                let [title_button, trigger_button] = [this._title, this._trigger].map((module) => {
                    let button = new Gtk.Button({
                        halign: module.halign,
                        valign: Gtk.Align.CENTER,
                    });

                    button.add(module);
                    Utils.set_hand_cursor_on_widget(button);
                    button.connect('clicked', () => this._selection.show_more());
                    return button;
                });

                // Style class needs to go on the button itself, so that we get :hover states and the like.
                title_button.get_style_context().add_class(Utils.get_element_style_class(ContentGroup, 'title'));
                /* Adding a class called title--clickable, when trigger is present,
                 * in order to properly style the color differences between an
                 * unclickable title & a clickable title. */
                title_button.get_style_context().add_class(Utils.get_bem_style_class(ContentGroup, '', 'title', 'clickable'));
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
            let context;
            if (!this._selection.provides_context())
                context = HistoryStore.get_default().get_current_item().context;
            else
                context = this._selection.get_models();

            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: context,
            });
        });

        this._no_results = this.create_submodule('no-results');

        // FIXME: use a composite template for this. Currently not possible
        // because Card.ContentGroup must inherit from this class.
        // https://bugzilla.gnome.org/show_bug.cgi?id=768790
        let builder = Gtk.Builder.new_from_resource('/com/endlessm/knowledge/data/widgets/contentGroup/contentGroup.ui');
        this._stack = builder.get_object('stack');
        this._log_button = builder.get_object('log-button');
        this._error_page = builder.get_object('error-page');
        this._button_image = builder.get_object('image1');

        // FIXME: extend the stack clip to cover its children clip.
        // https://bugzilla.gnome.org/show_bug.cgi?id=771436
        this._stack.connect('size-allocate', (stack, stack_alloc) => {
            let child = stack.get_visible_child();
            if (!child)
                return;

            let child_clip = child.get_clip();
            // translate to the stack's allocation coordinates space
            child_clip.x += stack_alloc.x;
            child_clip.y += stack_alloc.y;

            let stack_clip = stack.get_clip();
            stack_clip = stack_clip.union(child_clip);
            stack.set_clip(stack_clip);
        });

        let spinner = new SpinnerReplacement({
            visible: false,
            no_show_all: true,
            vexpand: true,
        });

        let content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            visible: true,
        });
        content_grid.add(this._arrangement);

        this._selection = this.create_submodule('selection', {
            model: this.model || null,
        });

        if (this.paginate) {
            let see_more_button = new Gtk.Button({
                halign: Gtk.Align.CENTER,
                label: _("See more"),
                no_show_all: true,
                visible: this.paginate,
            });

            see_more_button.get_style_context().add_class(Utils.get_element_style_class(ContentGroup, 'paginate'));
            see_more_button.connect('clicked', () => {
                if (this._selection.can_load_more && this.paginate)
                    this._selection.queue_load_more(this.cards_per_page);
            });
            this._selection.connect('notify::can-load-more', () => {
                see_more_button.visible = this._selection.can_load_more;
            });
            content_grid.add(see_more_button);
        }

        this._stack.add_named(content_grid, CONTENT_PAGE_NAME);

        if (this._no_results)
            this._stack.add_named(this._no_results, NO_RESULTS_PAGE_NAME);

        // Make sure we begin on the content page.
        this._stack.visible_child_name = CONTENT_PAGE_NAME;
        this._selection.connect('models-changed',
            this._on_models_changed.bind(this));
        this._selection.connect('notify::loading', () => {
            // When the spinner is not being shown on screen, set it to
            // be inactive to help with performance.
            spinner.active = spinner.visible = this._selection.loading;
            this._error_page.visible = !!this._selection.error;
            if (this._selection.error)
                this._stack.visible_child_name = ERROR_PAGE_NAME;
            else
                this._stack.visible_child_name = CONTENT_PAGE_NAME;
        });

        this._ensure_synced();
        this._selection.connect('notify::needs-refresh', this._ensure_synced.bind(this));

        this.attach(this._stack, 0, 1, 2, 1);
        this.attach(spinner, 0, 2, 2, 1);

        [[this._selection, 'can-load-more'], [this._arrangement, 'all-visible']].forEach((arr) => {
            let obj = arr[0];
            let property = arr[1];
            obj.connect('notify::' + property, () => {
                this.notify('has-more-content');
            });
        });

        this._selection.connect('notify::in-error-state',
            this._on_selection_error.bind(this));
        this._log_button.connect('clicked',
            this._on_log_button_click.bind(this));
        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
        HistoryStore.get_default().connect('notify::current-subset',
            this._on_subset_changed.bind(this));
    },

    _ensure_synced: function () {
        if (this._selection.needs_refresh) {
            this.load();
        }
    },

    get has_more_content () {
        return (!this._arrangement.all_visible || this._selection.can_load_more);
    },

    make_ready: function (cb=function () {}) {
        [this._title, this._trigger, this._no_results].forEach((module) => {
            if (module)
                module.make_ready();
        });
        if (!this._selection.loading) {
            cb();
        } else {
            let id = this._selection.connect('notify::loading', () => {
                if (!this._selection.loading) {
                    cb();
                    this._selection.disconnect(id); // only invoke callback once
                }
            });
        }
    },

    get_selection: function () {
        return this._selection;
    },

    _on_models_changed: function () {
        let models = this._selection.get_models();
        this.visible = true;
        if (models.length === 0) {
            this._arrangement.set_models([]);
            if (this._no_results) {
                this._stack.visible_child_name = NO_RESULTS_PAGE_NAME;
            } else {
                this.visible = false;
            }
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

    },

    _on_subset_changed: function () {
        let subset = HistoryStore.get_default().current_subset;
        if (subset)
            this._arrangement.highlight(subset);
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();

        if (item.model && this._selection.contains_model(item.model))
            this._arrangement.highlight(item.model);
        else
            this._arrangement.clear_highlight();

        this._arrangement.highlight_string(item.query);
    },

    _on_selection_error: function () {
        if (!this._selection.in_error_state)
            return;
        this._error_page.visible = true;
        this._stack.visible_child_name = ERROR_PAGE_NAME;
    },

    _on_log_button_click: function () {
        let timestamp = new Date(Date.now());
        let stamp = 'eos-knowledge-lib log ' + timestamp.toISOString() +
            '.txt';
        let path = GLib.build_filenamev([GLib.get_user_cache_dir(), stamp]);
        let log_file = Gio.File.new_for_path(path);
        let exception = this._selection.get_error();
        let app = Gio.Application.get_default();
        let log = [
            'Log file for Xapian failure',
            '===========================',
            'Endless customer support: Please report to Apps team on Phabricator',
            'App ID: ' + (app ? app.application_id : 'unknown'),
            'Module path: ' + this.factory_path,
            'Timestamp: ' + timestamp.toISOString(),
            'Error message: ' + (exception ? exception.message : 'none'),
            '',
        ].join('\n');
        log += exception ? exception.stack : '';
        let [ok] = log_file.replace_contents(log, null, false,
            Gio.FileCreateFlags.NONE, null);
        if (!ok) {
            this._button_image.icon_name = 'action-unavailable-symbolic';
            return;
        }
        Gtk.show_uri(Gdk.Screen.get_default(), log_file.get_uri(),
            Gdk.CURRENT_TIME);
        this._button_image.icon_name = 'object-select-symbolic';
    },

    load: function () {
        this._selection.clear();
        let cards_to_load = this.cards_per_page;
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            cards_to_load = max_cards;
        this._selection.queue_load_more(cards_to_load);
    },
});

const SpinnerReplacement = new Lang.Class({
    Name: 'SpinnerReplacement',
    Extends: Gtk.Revealer,

    _init(props={}) {
        props.transition_duration = 200;
        props.transition_type = Gtk.RevealerTransitionType.CROSSFADE;
        this.parent(props);

        let fake_spinner = Gtk.Image.new_from_icon_name('content-loading-symbolic',
            Gtk.IconSize.DIALOG);
        fake_spinner.show();
        this.add(fake_spinner);
    },

    get active() {
        return this.reveal_child;
    },

    set active(v) {
        this.reveal_child = v;
    },
});
