const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const SuggestedArticles = imports.app.modules.selection.suggestedArticles;

Gtk.init(null);

function setup (store) {
    // Selection.SuggestedArticles only works when the global state is aware of a search
    // query
    store.set_current_item_from_props({
        page_type: 'search',
        query: 'foobar',
    });
}

Compliance.test_selection_compliance(SuggestedArticles.SuggestedArticles,
    setup);
Compliance.test_xapian_selection_compliance(SuggestedArticles.SuggestedArticles,
    setup);
