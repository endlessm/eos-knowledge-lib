const Actions = imports.framework.actions;
const Dispatcher = imports.framework.dispatcher;
const HistoryStore = imports.framework.historyStore;
const NavButtonOverlay = imports.framework.widgets.navButtonOverlay;
const Module = imports.framework.interfaces.module;
const Pages = imports.framework.pages;

/**
 * Class: Navigation
 *
 * A module which displays navigation arrows on either side of a page.
 */
var Navigation = new Module.Class({
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
        let item = HistoryStore.get_default().get_current_item();
        this.back_visible = (item.page_type != Pages.HOME);
    },
});
