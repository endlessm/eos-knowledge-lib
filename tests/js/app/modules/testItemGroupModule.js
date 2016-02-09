const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const ItemGroupModule = imports.app.modules.itemGroupModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Item group module', function () {
    let group, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement, {
            'card-type': 'home-card',
        });
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('item-group', ItemGroupModule.ItemGroupModule, {
            'arrangement': 'test-arrangement',
        });
        group = factory.create_named_module('item-group');
        arrangement = factory.get_created_named_mocks('test-arrangement')[0];
    });

    it('constructs', function () {
        expect(group).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(group).toHaveDescendant(arrangement);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('home-card');
        expect(cards.length).toEqual(0);
    });

    it('adds dispatched cards to the arrangement', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_ITEMS,
            models: models,
        });
        expect(arrangement.get_models().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(3);
    });

    it('clears the existing cards when clear called', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_ITEMS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_ITEMS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_ITEMS,
            models: models,
        });
        expect(arrangement.get_models().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(6);
    });

    it('dispatches item clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_ITEMS,
            models: [ model ],
        });
        arrangement.emit('card-clicked', model);
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });
});

Compliance.test_card_container_fade_in_compliance(Actions.APPEND_ITEMS,
    ItemGroupModule.ItemGroupModule);
