const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const SuggestedCategoriesModule = imports.app.modules.suggestedCategoriesModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Suggested categories module', function () {
    let suggestions, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement, {
            'card-type': 'home-card',
        });
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('suggested-categories', SuggestedCategoriesModule.SuggestedCategoriesModule, {
            'arrangement': 'test-arrangement',
        });
        suggestions = factory.create_named_module('suggested-categories');
        arrangement = factory.get_created_named_mocks('test-arrangement')[0];
    });

    it('constructs', function () {
        expect(suggestions).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(suggestions).toHaveDescendant(arrangement);
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
        expect(arrangement.get_count()).toBe(3);
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
        expect(arrangement.get_count()).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(6);
    });

    it('removes cards that are filtered out', function () {
        let first_ekn_id = 'ekn://test/set/1';
        let second_ekn_id = 'ekn://test/set/2';

        let models = [
            new ContentObjectModel.ContentObjectModel({
                ekn_id: first_ekn_id,
            }),
            new ContentObjectModel.ContentObjectModel({
                ekn_id: second_ekn_id,
            }),
        ];

        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.FILTER_SETS,
            sets: [first_ekn_id],
        });

        expect(arrangement.get_count()).toBe(1);
    });

    it('adds only featured cards when featured-only is true', function () {
        suggestions = factory.create_named_module('suggested-categories', {
            featured_only: true,
        });
        arrangement = factory.get_created_named_mocks('test-arrangement')[1];
        let models = [true, false, true].map(featured =>
            new ContentObjectModel.ContentObjectModel({ featured: featured }));
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(arrangement.get_count()).toBe(2);
    });

    it('dispatches set clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: [ model ],
        });
        arrangement.emit('card-clicked', model);
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.SET_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });
});
