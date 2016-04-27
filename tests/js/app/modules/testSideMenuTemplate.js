// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SideMenuTemplate = imports.app.modules.sideMenuTemplate;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Side menu template', function () {
    let template, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('mock-context', Gtk.Label);
        factory.add_named_mock('mock-sidebar', Gtk.Label);
        factory.add_named_mock('template', SideMenuTemplate.SideMenuTemplate, {
            'content': 'mock-content',
            'context': 'mock-context',
            'sidebar': 'mock-sidebar',
        });
        template = factory.create_named_module('template');
    });

    it('constructs', function () {
        expect(template).toEqual(jasmine.anything());
    });

    it('has widgets with the proper CSS classes', function () {
        expect(template).toHaveDescendantWithCssClass('close-button');
        expect(template).toHaveDescendantWithCssClass('context-bar');
        expect(template).toHaveDescendantWithCssClass('home-button');
        expect(template).toHaveDescendantWithCssClass('menu');
        expect(template).toHaveDescendantWithCssClass('menu-button');
    });

    it('packs all its children', function () {
        let content = factory.get_created_named_mocks('mock-content')[0];
        let context = factory.get_created_named_mocks('mock-context')[0];
        let sidebar = factory.get_created_named_mocks('mock-sidebar')[0];
        expect(template).toHaveDescendant(content);
        expect(template).toHaveDescendant(context);
        expect(template).toHaveDescendant(sidebar);
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
