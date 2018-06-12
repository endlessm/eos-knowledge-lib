const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.framework.historyStore;
const MockFactory = imports.tests.mockFactory;
const Navigation = imports.framework.modules.layout.navigation;
const Pages = imports.framework.pages;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Layout.Navigation', function () {
    let layout, store, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        [layout, factory] = MockFactory.setup_tree({
            type: Navigation.Navigation,
            slots: {
                'content': { type: null },
            },
        });
    });

    it('packs its content', function () {
        let content = factory.get_last_created('content');
        expect(layout).toHaveDescendant(content);
    });

    it('starts out with arrows disabled', function () {
        expect(layout.back_visible).toBeFalsy();
        expect(layout.forward_visible).toBeFalsy();
    });

    it('disables the back arrow on the home page', function () {
        store.set_current_item_from_props({ page_type: Pages.HOME });
        expect(layout.back_visible).toBeFalsy();
    });

    it('enables the back arrow on other pages', function () {
        store.set_current_item_from_props({ page_type: Pages.SET });
        expect(layout.back_visible).toBeTruthy();
        store.set_current_item_from_props({ page_type: Pages.SEARCH });
        expect(layout.back_visible).toBeTruthy();
        store.set_current_item_from_props({ page_type: Pages.ARTICLE });
        expect(layout.back_visible).toBeTruthy();
        store.set_current_item_from_props({ page_type: Pages.ALL_SETS });
        expect(layout.back_visible).toBeTruthy();
    });
});
