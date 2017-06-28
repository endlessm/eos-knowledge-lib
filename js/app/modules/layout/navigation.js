const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const NavButtonOverlay = imports.app.widgets.navButtonOverlay;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;

/**
 * Class: Navigation
 *
 * A module which displays navigation arrows on either side of a page.
 */
const Navigation = new Module.Class({
    Name: 'Layout.Navigation',
    Extends: NavButtonOverlay.NavButtonOverlay,

    Slots: {
        'content': {},
    },

    _init: function (props={}) {
        props.back_visible = props.back_visible || false;
        props.forward_visible = props.forward_visible || false;
        this.parent(props);

        this.add(this.create_submodule('content'));

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
        this.connect('back-clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.NAV_BACK_CLICKED,
            });
        });
        this.connect('forward-clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.NAV_FORWARD_CLICKED,
            });
        });
    },

    _on_history_changed: function () {
        // The back button should only be visible if we can go back
        this.back_visible = HistoryStore.get_default().can_go_back();
    },
});
