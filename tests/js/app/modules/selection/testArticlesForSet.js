const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticlesForSet = imports.app.modules.selection.articlesForSet;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

Compliance.test_selection_compliance(ArticlesForSet.ArticlesForSet, function () {
    let store = new HistoryStore.HistoryStore();
    HistoryStore.set_default(store);
    store.set_current_item_from_props({
        page_type: 'set',
        model: new SetObjectModel.SetObjectModel(),
    });
});

describe('Selection.ArticlesForSet', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: ArticlesForSet.ArticlesForSet,
        });
    });

    it('dispatches item-clicked when asked to show more', function () {
        let model = new SetObjectModel.SetObjectModel();
        selection.model = model;
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
            .toBeDefined();
    });
});
