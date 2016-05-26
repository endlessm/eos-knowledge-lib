const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SearchAndItem = imports.app.modules.layout.searchAndItem;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Layout.SearchAndItem', function () {
    let module, search, item, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        let factory;
        [module, factory] = MockFactory.setup_tree({
            type: SearchAndItem.SearchAndItem,
            slots: {
                'item': { type: Minimal.MinimalArrangement },
                'search': { type: Minimal.MinimalArrangement },
            },
        });
        module.show_all();
        search = factory.get_last_created('search');
        item = factory.get_last_created('item');
    });

    it('creates and packs item module', function () {
        expect(module).toHaveDescendant(item);
    });

    it('creates and packs search module', function () {
        expect(module).toHaveDescendant(search);
    });

    it('shows the item module after set ready dispatched', function () {
        dispatcher.dispatch({
            action_type: Actions.SET_READY,
        });
        expect(module.visible_child).toBe(item);
    });

    it('shows the search module after search ready dispatched', function () {
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
        });
        expect(module.visible_child).toBe(search);
    });
});
