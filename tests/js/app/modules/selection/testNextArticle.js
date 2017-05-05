const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const NextArticle = imports.app.modules.selection.nextArticle;
const Pages = imports.app.pages;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

const EKN_ID = 'ekn:///e430d1587a3710f5c1444d96b07eb3ee7a2b2a1e';

function setup (store) {
    let model = Eknc.ArticleObjectModel.new_from_props({
      ekn_id: 'ekn:///d3eee75ff0beef2c001c00b424e632280e671f32',
    });

    let next_model = Eknc.ArticleObjectModel.new_from_props({
      ekn_id: EKN_ID,
    });

    store.set_current_item_from_props({
        page_type: Pages.ARTICLE,
        model: model,
        context: [model, next_model],
    });
}

describe('Selection.NextArticle', function () {
    let selection, engine;

    beforeEach(function () {
        engine = MockEngine.mock_default();

        let store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        [selection] = MockFactory.setup_tree({
            type: NextArticle.NextArticle,
        });
        setup(store);
    });

    it('queries for the next model id', function () {
        selection.queue_load_more(1);
        let query = engine.query_promise.calls.mostRecent().args[0];
        expect(query.ids[0]).toBe(EKN_ID);
    });
});

Compliance.test_selection_compliance(NextArticle.NextArticle, setup);
Compliance.test_xapian_selection_compliance(NextArticle.NextArticle, setup);
