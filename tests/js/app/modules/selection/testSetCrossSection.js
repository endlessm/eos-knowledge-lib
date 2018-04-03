const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const SetCrossSection = imports.app.modules.selection.setCrossSection;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

function setup (store) {
    store.set_current_item_from_props({
        page_type: 'set',
        model: new DModel.Set(),
    });
}

Compliance.test_selection_compliance(SetCrossSection.SetCrossSection, setup);
Compliance.test_xapian_selection_compliance(SetCrossSection.SetCrossSection,
    setup);

describe('Selection.SetCrossSection', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: SetCrossSection.SetCrossSection,
        });
    });

    it('dispatches item-clicked when asked to show more', function () {
        let model = new DModel.Set();
        selection.model = model;
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
            .toBeDefined();
    });
});
