const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const SupplementaryArticlesModule = imports.app.modules.supplementaryArticlesModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Supplementary articles module', function () {
    let supplementary, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement, {
            'card-type': 'home-card',
        });
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('supplementary-articles', SupplementaryArticlesModule.SupplementaryArticlesModule, {
            'arrangement': 'test-arrangement',
        }, {
            same_set: true,
        });
        supplementary = factory.create_named_module('supplementary-articles');
        arrangement = factory.get_created_named_mocks('test-arrangement')[0];
    });

    it('constructs', function () {
        expect(supplementary).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(supplementary).toHaveDescendant(arrangement);
    });

    it('adds dispatched cards to the arrangement', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: models,
            same_set: true,
        });
        expect(arrangement.get_models().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(3);
    });

    it('does not add cards that are not for its set', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: models,
            same_set: false,
        });
        expect(arrangement.get_models().length).toBe(0);
    });

    it('requests _read_ cards when it receives zero unread cards', function () {
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: [],
            same_set: true,
            need_unread: true,
            set_tags: ['foo', 'bar'],
        });
        expect(arrangement.get_models().length).toBe(0);

        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.NEED_MORE_SUPPLEMENTARY_ARTICLES);
        let matcher = jasmine.objectContaining({
            same_set: true,
            need_unread: false,
            set_tags: ['foo', 'bar'],
        });
        expect(payload).toEqual(matcher);
    });

    it('clears the existing cards when clear called', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: models,
            same_set: true,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SUPPLEMENTARY_ARTICLES,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: models,
            same_set: true,
        });
        expect(arrangement.get_models().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(6);
    });

    it('dispatches item clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
            models: [ model ],
            same_set: true,
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
