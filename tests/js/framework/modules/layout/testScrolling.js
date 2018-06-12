// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.framework.historyStore;
const MockFactory = imports.tests.mockFactory;
const Scrolling = imports.framework.modules.layout.scrolling;
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
});
