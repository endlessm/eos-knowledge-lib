const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const SuggestedArticles = imports.app.modules.selection.suggestedArticles;

Gtk.init(null);

Compliance.test_selection_compliance(SuggestedArticles.SuggestedArticles, function () {
    // Selection.SuggestedArticles only works when the global state is aware of a search
    // query
    let store = new HistoryStore.HistoryStore();
    HistoryStore.set_default(store);
    store.set_current_item_from_props({
        page_type: 'search',
        query: 'foobar',
    });
});
