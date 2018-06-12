const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.framework.actions;
const AllSets = imports.framework.modules.selection.allSets;
const Compliance = imports.tests.compliance;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

Compliance.test_selection_compliance(AllSets.AllSets);
Compliance.test_xapian_selection_compliance(AllSets.AllSets);

describe('Selection.AllSets', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: AllSets.AllSets,
        });
    });

    it('dispatches a ALL_SETS_CLICKED when asked to show more', function () {
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.ALL_SETS_CLICKED)).toBeDefined();
    });
});
