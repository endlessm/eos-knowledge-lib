const {DModel, Gtk} = imports.gi;

const Next = imports.app.modules.selection.next;
const Pages = imports.app.pages;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

const ID = 'ekn:///e430d1587a3710f5c1444d96b07eb3ee7a2b2a1e';

function setup (store) {
    let model = new DModel.Article();
    let next_model = new DModel.Article({
        id: ID,
    });

    store.set_current_item_from_props({
        page_type: Pages.ARTICLE,
        model: model,
        context: [model, next_model],
    });
}

describe('Selection.Next', function () {
    let selection, engine;

    beforeEach(function () {
        engine = MockEngine.mock_default();

        let store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        [selection] = MockFactory.setup_tree({
            type: Next.Next,
        });
        setup(store);
    });

    it('queries for the next model id', function () {
        selection.queue_load_more(1);
        let query = engine.query_promise.calls.mostRecent().args[0];
        expect(query.ids[0]).toBe(ID);
    });
});

Compliance.test_selection_compliance(Next.Next, setup);
Compliance.test_xapian_selection_compliance(Next.Next, setup);
