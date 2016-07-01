// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Scrolling = imports.app.modules.layout.scrolling;
const Pages = imports.app.pages;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.Scrolling', function () {
    let factory, layout, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [layout, factory] = MockFactory.setup_tree({
            type: Scrolling.Scrolling,
            slots: {
                'content': { type: null },
            },
        });
    });

    it('packs all its children', function () {
        let content = factory.get_last_created('content');
        expect(layout).toHaveDescendant(content);
    });

    describe('when showing pages', function () {
        beforeEach(function () {
            layout.vadjustment.set_value(layout.vadjustment.get_upper());
        });

        function test_show_page (page) {
            it('scrolls back to the top of the ' + page + ' page', function () {
                store.set_current_item_from_props({ page_type: page });
                expect(layout.vadjustment.get_value()).toBe(layout.vadjustment.get_lower());
            });
        }
        test_show_page(Pages.HOME);
        test_show_page(Pages.ALL_SETS);
        test_show_page(Pages.SET);
        test_show_page(Pages.SEARCH);
        test_show_page(Pages.ARTICLE);
    });
});
