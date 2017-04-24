const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const RelatedArticles = imports.app.modules.selection.relatedArticles;
const Pages = imports.app.pages;
const Compliance = imports.tests.compliance;

Gtk.init(null);

function setup (store) {
    store.set_current_item_from_props({
        page_type: Pages.ARTICLE,
        model: Eknc.ArticleObjectModel.new_from_props(),
    });
}

Compliance.test_selection_compliance(RelatedArticles.RelatedArticles, setup);
Compliance.test_xapian_selection_compliance(RelatedArticles.RelatedArticles, setup);
