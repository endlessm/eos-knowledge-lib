const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticlesForSet = imports.app.modules.selection.articlesForSet;
const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

Compliance.test_selection_compliance(ArticlesForSet.ArticlesForSet);

describe('Selection.ArticlesForSet', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: ArticlesForSet.ArticlesForSet,
        });
    });

    it('dispatches a SET_CLICKED when asked to show more', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        selection.model = model;
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.SET_CLICKED)).toBeDefined();
    });
});
