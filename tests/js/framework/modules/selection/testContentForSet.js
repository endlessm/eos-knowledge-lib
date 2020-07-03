const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.framework.actions;
const ContentForSet = imports.framework.modules.selection.contentForSet;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.framework.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

function setup (store) {
    store.set_current_item_from_props({
        page_type: 'set',
        model: new DModel.Set(),
    });
}

Compliance.test_selection_compliance(ContentForSet.ContentForSet, setup);
Compliance.test_xapian_selection_compliance(ContentForSet.ContentForSet,
    setup);

xdescribe('Selection.ContentForSet', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: ContentForSet.ContentForSet,
        });
    });

    it('dispatches item-clicked when asked to show more', function () {
        selection.model = new DModel.Set();
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
            .toBeDefined();
    });
});
