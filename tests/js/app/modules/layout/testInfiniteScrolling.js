// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const InfiniteScrolling = imports.app.modules.layout.infiniteScrolling;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Scrolling template', function () {
    let factory, template;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('placeholder', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('template', InfiniteScrolling.InfiniteScrolling, {
            'content': 'placeholder',
        });
        template = factory.create_named_module('template');
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let content = factory.get_created_named_mocks('placeholder')[0];
        expect(template).toHaveDescendant(content);
    });

    describe('when showing pages', function () {
        beforeEach(function () {
            template.vadjustment.set_value(template.vadjustment.get_upper());
        });

        function test_show_page (action, descriptor) {
            it('scrolls back to the top of the ' + descriptor + ' page', function () {
                MockDispatcher.mock_default().dispatch({
                    action_type: action,
                });
                expect(template.vadjustment.get_value()).toBe(template.vadjustment.get_lower());
            });
        }
        test_show_page(Actions.SHOW_HOME_PAGE, 'home');
        test_show_page(Actions.SHOW_ALL_SETS_PAGE, 'sets');
        test_show_page(Actions.SHOW_SECTION_PAGE, 'section');
        test_show_page(Actions.SHOW_SEARCH_PAGE, 'search');
        test_show_page(Actions.SHOW_ARTICLE_PAGE, 'article');
    });
});
