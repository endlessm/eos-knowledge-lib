// Copyright 2018 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

const Minimal = imports.tests.minimal;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;

Gtk.init(null);

describe('Scrolling Interface', function () {
    let factory, layout, store, win, offset;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        [layout, factory] = MockFactory.setup_tree({
            type: Minimal.MinimalScrolling,
            properties: {
                'max-content-height': 10,
            },
            slots: {
                'content': {
                    type: Minimal.MinimalCard,
                    properties: {
                        'margin-top': 1000,
                    },
                },
            },
        });

        win = new Gtk.OffscreenWindow();
        win.add(layout);
        win.show_all();
        offset = layout.vadjustment.get_upper() - layout.vadjustment.page_size;
    });

    afterEach(function () {
        win.destroy();
    });

    describe('when showing pages', function () {
        function test_show_page (page) {
            it('scrolls back to the top of the ' + page + ' page', function () {
                layout.vadjustment.set_value(offset);
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

    describe('when showing a lightbox', function () {
        function test_with_lightbox (action, from, to) {
            it('does not scroll back to the top when ' + action, function () {
                store.set_current_item_from_props(from);
                layout.vadjustment.set_value(offset);
                store.set_current_item_from_props(to);
                expect(layout.vadjustment.get_value()).toBe(offset);
            });
        }
        let media_model = new DModel.Media();
        test_with_lightbox('opening', { page_type: Pages.HOME }, { media_model: media_model });
        test_with_lightbox('closing', { media_model: media_model }, { page_type: Pages.HOME });
        test_with_lightbox('browsing', { media_model: media_model }, { media_model: media_model });
    });
});
