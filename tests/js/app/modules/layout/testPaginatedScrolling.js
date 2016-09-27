// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const Pages = imports.app.pages;
const PaginatedScrolling = imports.app.modules.layout.paginatedScrolling;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.PaginatedScrolling', function () {
    let factory, template, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [template, factory] = MockFactory.setup_tree({
            type: PaginatedScrolling.PaginatedScrolling,
            references: {
                'paginated-load': 'selection',
            },
            slots: {
                'content': {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'arrangement': { type: Minimal.MinimalArrangement },
                        'selection': {
                            type: Minimal.MinimalSelection,
                            id: 'selection',
                        },
                    },
                },
            },
        });
    });

    it('packs all its children', function () {
        let content = factory.get_last_created('content');
        expect(template).toHaveDescendant(content);
    });

    it('has a see more button', function () {
        expect(template).toHaveDescendantWithClass(Gtk.Button);
    });

    describe('when showing pages', function () {
        beforeEach(function () {
            template.vadjustment.set_value(template.vadjustment.get_upper());
        });

        function test_show_page (page) {
            it('scrolls back to the top of the ' + page + ' page', function () {
                store.set_current_item_from_props({ page_type: page });
                expect(template.vadjustment.get_value()).toBe(template.vadjustment.get_lower());
            });
        }
        test_show_page(Pages.HOME);
        test_show_page(Pages.ALL_SETS);
        test_show_page(Pages.SET);
        test_show_page(Pages.SEARCH);
        test_show_page(Pages.ARTICLE);
    });
});
