const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SearchAndItem = imports.app.modules.layout.searchAndItem;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Layout.SearchAndItem', function () {
    let module, search, item, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-search', Minimal.MinimalArrangement);
        factory.add_named_mock('test-item', Minimal.MinimalArrangement);
        factory.add_named_mock('module', SearchAndItem.SearchAndItem, {
            'item': 'test-item',
            'search': 'test-search',
        });
        module = factory.create_named_module('module');
        module.show_all();
        search = factory.get_created_named_mocks('test-search')[0];
        item = factory.get_created_named_mocks('test-item')[0];
    });

    it('constructs', function () {
        expect(module).toBeDefined();
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
