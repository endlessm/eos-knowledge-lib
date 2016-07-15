const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleContext = imports.app.modules.selection.articleContext;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

function setup() {
    let store = new HistoryStore.HistoryStore();
    HistoryStore.set_default(store);
    store.set_current_item_from_props({
        page_type: Pages.SET,
        model: new SetObjectModel.SetObjectModel(),
    });
}

Compliance.test_selection_compliance(ArticleContext.ArticleContext, setup);
Compliance.test_xapian_selection_compliance(ArticleContext.ArticleContext,
    setup);
