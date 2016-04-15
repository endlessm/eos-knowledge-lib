const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const NavButtonOverlay = imports.app.widgets.navButtonOverlay;
const Module = imports.app.interfaces.module;

/**
 * Class: NavigationModule
 *
 * A module which displays navigation arrows on either side of a page.
 */
const NavigationModule = new Module.Class({
    Name: 'NavigationModule',
    GTypeName: 'EknNavigationModule',
    CssName: 'EknNavigationModule',
    Extends: NavButtonOverlay.NavButtonOverlay,
    Implements: [ Module.Module ],

    _init: function (props={}) {
        this.parent(props);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.NAV_BACK_ENABLED_CHANGED:
                    this.back_visible = payload.enabled;
                    break;
                case Actions.NAV_FORWARD_ENABLED_CHANGED:
                    this.forward_visible = payload.enabled;
                    break;
            }
        });
        this.connect('back-clicked', () => {
            dispatcher.dispatch({
                action_type: Actions.NAV_BACK_CLICKED,
            });
        });
        this.connect('forward-clicked', () => {
            dispatcher.dispatch({
                action_type: Actions.NAV_FORWARD_CLICKED,
            });
        });
    },
});
