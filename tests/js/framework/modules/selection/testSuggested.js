const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const HistoryStore = imports.framework.historyStore;
const Suggested = imports.framework.modules.selection.suggested;

Gtk.init(null);

function setup (store) {
    // Selection.Suggested only works when the global state is aware of search
    // terms
    store.set_current_item_from_props({
        page_type: 'search',
        search_terms: 'foobar',
    });
}

Compliance.test_selection_compliance(Suggested.Suggested, setup);
Compliance.test_xapian_selection_compliance(Suggested.Suggested, setup);
