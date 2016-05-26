const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const SuggestedArticles = imports.app.modules.contentGroup.suggestedArticles;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('ContentGroup.SuggestedArticles', function () {
    let suggestions, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        [suggestions, factory] = MockFactory.setup_tree({
            type: SuggestedArticles.SuggestedArticles,
            slots: {
                'arrangement': {
                    type: Minimal.MinimalArrangement,
                    slots: {
                        'card-type': { type: Minimal.MinimalCard },
                    },
                },
            },
        });
        arrangement = factory.get_last_created('arrangement');
    });

    it('constructs', function () {
        expect(suggestions).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(suggestions).toHaveDescendant(arrangement);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created('arrangement.card-type');
        expect(cards.length).toEqual(0);
    });

    it('adds dispatched cards to the arrangement', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUGGESTED_ARTICLES,
            models: models,
        });
        expect(arrangement.get_count()).toBe(3);
        expect(factory.get_created('arrangement.card-type').length).toBe(3);
    });

    it('clears the existing cards when clear called', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUGGESTED_ARTICLES,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SUGGESTED_ARTICLES,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUGGESTED_ARTICLES,
            models: models,
        });
        expect(arrangement.get_count()).toBe(3);
        expect(factory.get_created('arrangement.card-type').length).toBe(6);
    });

    it('dispatches item clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SUGGESTED_ARTICLES,
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
