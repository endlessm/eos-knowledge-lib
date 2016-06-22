const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: Encyclopedia
 *
 * Slots:
 *   lightbox
 *   pager
 */
const Encyclopedia = new Module.Class({
    Name: 'Window.Encyclopedia',
    Extends: Endless.Window,

    Slots: {
        'lightbox': {},
        'pager': {},
    },

    _init: function (props={}) {
        delete props.template_type;
        this.parent(props);

        this._home_button = new Endless.TopbarHomeButton({
            sensitive: false,
        });
        this._history_buttons = new Endless.TopbarNavButton();
        this._history_buttons.show_all();
        let dispatcher = Dispatcher.get_default();
        this._home_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HOME_CLICKED });
        });
        this._history_buttons.back_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        });
        this._history_buttons.forward_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        });

        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.PRESENT_WINDOW:
                    this._pending_present = true;
                    this._present_timestamp = payload.timestamp;
                    break;
                case Actions.HISTORY_BACK_ENABLED_CHANGED:
                    this._history_buttons.back_button.sensitive = payload.enabled;
                    break;
                case Actions.HISTORY_FORWARD_ENABLED_CHANGED:
                    this._history_buttons.forward_button.sensitive = payload.enabled;
                    break;
                case Actions.SHOW_HOME_PAGE:
                    this._home_button.sensitive = false;
                    this._present_if_needed();
                    break;
                case Actions.SHOW_SEARCH_PAGE:
                case Actions.SHOW_ARTICLE_PAGE:
                    this._home_button.sensitive = true;
                    this._present_if_needed();
                    break;
            }
        });

        let button_box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        button_box.add(this._home_button);
        button_box.add(this._history_buttons);
        button_box.show_all();

        this._pager = this.create_submodule('pager');

        // We need to pack a bunch of modules inside each other, but some of
        // them are optional. "matryoshka" is the innermost widget that needs to
        // have something packed around it.
        let matryoshka = this._pager;
        let lightbox = this.create_submodule('lightbox');
        if (lightbox) {
            lightbox.add(matryoshka);
            matryoshka = lightbox;
        }

        this.page_manager.add(matryoshka, {
            left_topbar_widget: button_box,
        });

        this.get_child().show_all();

        this._pager.connect('notify::transition-running', () => {
            if (this._pager.transition_running) {
                Utils.squash_all_window_content_updates_heavy_handedly(this);
            } else {
                Utils.unsquash_all_window_content_updates_heavy_handedly(this);
            }
        });
    },

    _present_if_needed: function () {
        if (this._pending_present) {
            if (this._present_timestamp)
                this.present_with_time(this._present_timestamp);
            else
                this.present();
            this._pending_present = false;
            this._present_timestamp = null;
        }
    },

    make_ready: function (cb=function () {}) {
        this._pager.make_ready(cb);
    },
});
