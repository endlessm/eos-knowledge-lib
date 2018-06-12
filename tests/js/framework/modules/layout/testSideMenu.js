// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.framework.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SideMenu = imports.framework.modules.layout.sideMenu;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Layout.SideMenu', function () {
    let template, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();

        [template, factory] = MockFactory.setup_tree({
            type: SideMenu.SideMenu,
            slots: {
                'content': { type: null },
                'context': { type: null },
                'sidebar': { type: null },
            },
        });
    });

    it('has widgets with the proper CSS classes', function () {
        expect(template).toHaveDescendantWithCssClass('LayoutSideMenu__closeButton');
        expect(template).toHaveDescendantWithCssClass('LayoutSideMenu__menuButton');
        expect(template).toHaveDescendantWithCssClass('LayoutSideMenu__homeButton');
        expect(template).toHaveDescendantWithCssClass('LayoutSideMenu__contextBar');
        expect(template).toHaveDescendantWithCssClass('LayoutSideMenu__menu');
    });

    it('packs all its children', function () {
        expect(template).toHaveDescendant(factory.get_last_created('content'));
        expect(template).toHaveDescendant(factory.get_last_created('context'));
        expect(template).toHaveDescendant(factory.get_last_created('sidebar'));
    });

    it('has the menu closed by default', function () {
        expect(template.menu_open).toBeFalsy();
    });

    it('opens the menu when you click the menu button', function () {
        template.menu_button.emit('clicked');
        Utils.update_gui();
        expect(template.menu_open).toBeTruthy();
    });

    it('closes the menu when you click the close button', function () {
        template.menu_button.emit('clicked');
        Utils.update_gui();
        template.menu_close_button.emit('clicked');
        Utils.update_gui();
        expect(template.menu_open).toBeFalsy();
    });

    xit('opens the menu when you move the mouse to the edge', function () {
        // FIXME: Simulate mouse movement here
        Utils.update_gui();
        expect(template.menu_open).toBeTruthy();
    });

    xit('closes the menu when you move the mouse outside of the menu', function () {
        template.menu_button.emit('clicked');
        Utils.update_gui();
        // FIXME: Simulate mouse movement here
        Utils.update_gui();
        expect(template.menu_open).toBeFalsy();
    });

    it('dispatches home-clicked when the home button is clicked', function () {
        template.home_button.emit('clicked');
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.HOME_CLICKED)).toBeDefined();
    });
});
