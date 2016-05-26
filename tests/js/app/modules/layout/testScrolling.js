// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const Scrolling = imports.app.modules.layout.scrolling;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.Scrolling', function () {
    let factory, layout;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('placeholder', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('layout', Scrolling.Scrolling, {
            'content': 'placeholder',
        });
        layout = factory.create_named_module('layout');
    });

    it('packs all its children', function () {
        let content = factory.get_created_named_mocks('placeholder')[0];
        expect(layout).toHaveDescendant(content);
    });

    describe('when showing pages', function () {
        beforeEach(function () {
            layout.vadjustment.set_value(layout.vadjustment.get_upper());
        });

        function test_show_page (action, descriptor) {
            it('scrolls back to the top when showing the ' + descriptor + ' page', function () {
                MockDispatcher.mock_default().dispatch({
                    action_type: action,
                });
                expect(layout.vadjustment.get_value()).toBe(layout.vadjustment.get_lower());
            });
        }
        test_show_page(Actions.SHOW_HOME_PAGE, 'home');
        test_show_page(Actions.SHOW_ALL_SETS_PAGE, 'sets');
        test_show_page(Actions.SHOW_SECTION_PAGE, 'section');
        test_show_page(Actions.SHOW_SEARCH_PAGE, 'search');
        test_show_page(Actions.SHOW_ARTICLE_PAGE, 'article');
    });
});
