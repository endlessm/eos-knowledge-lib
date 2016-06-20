const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const Search = imports.app.modules.selection.search;


Compliance.test_selection_compliance(Search.Search, function () {
    // Selection.Search only works when the global state is aware of a search
    // query
    let store = new HistoryStore.HistoryStore();
    HistoryStore.set_default(store);
    store.set_current_item_from_props({
        page_type: 'search',
        query: 'foobar',
    });
});
