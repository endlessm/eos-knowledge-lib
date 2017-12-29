const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const Search = imports.app.modules.selection.search;

function setup (store) {
    // Selection.Search only works when the global state is aware of search
    // terms
    store.set_current_item_from_props({
        page_type: 'search',
        search_terms: 'foobar',
    });
}

Compliance.test_selection_compliance(Search.Search, setup);
Compliance.test_xapian_selection_compliance(Search.Search, setup);
