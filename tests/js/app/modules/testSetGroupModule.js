// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SetGroupModule = imports.app.modules.setGroupModule;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Set group module', function () {
    let group, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('item-group', SetGroupModule.SetGroupModule, {
            arrangement: 'test-arrangement',
            card_type: 'home-card',
        });
        group = new SetGroupModule.SetGroupModule({
            factory: factory,
            factory_name: 'item-group',
        });
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
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(arrangement.get_cards().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(3);
    });

    it('clears the existing cards when clear called', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SETS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(arrangement.get_cards().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(6);
    });
});
