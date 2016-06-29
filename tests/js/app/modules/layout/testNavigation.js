const Gtk = imports.gi.Gtk;
Gtk.init(null);

const HistoryStore = imports.app.historyStore;
const Navigation = imports.app.modules.layout.navigation;
const Pages = imports.app.pages;

describe('Layout.Navigation', function () {
    let layout, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        layout = new Navigation.Navigation();
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
