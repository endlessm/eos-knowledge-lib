const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleContext = imports.framework.modules.selection.articleContext;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.framework.historyStore;
const Pages = imports.framework.pages;

Gtk.init(null);

function setup (store) {
    store.set_current_item_from_props({
        page_type: Pages.SET,
        model: new DModel.Set(),
    });
}

Compliance.test_selection_compliance(ArticleContext.ArticleContext, setup);
Compliance.test_xapian_selection_compliance(ArticleContext.ArticleContext,
    setup);
