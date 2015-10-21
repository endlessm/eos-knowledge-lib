// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const HighlightsModule = imports.app.modules.highlightsModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Highlights module', function () {
    let module, featured, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', HighlightsModule.HighlightsModule, {
            'arrangement': 'arrangement',
            'card-type': 'article-card',
            'header-card-type': 'set-card',
        });
        module = new HighlightsModule.HighlightsModule({
            factory: factory,
            factory_name: 'highlights',
        });
        featured = factory.get_created_named_mocks('arrangement')[0];
    });

    it('constructs', function () {
        expect(module).toBeDefined();
    });

    it('creates and packs an arrangement widget for the featured cards', function () {
        expect(module).toHaveDescendant(featured);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('article-card');
        expect(cards.length).toEqual(0);
        cards = factory.get_created_named_mocks('set-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching sets', function () {
        let arrangements, headers, set_models, article_models, engine;

        beforeEach(function () {
            set_models = [['a'], ['b'], ['c', 'd']].map(tags =>
                new SetObjectModel.SetObjectModel({
                    featured: false,
                    child_tags: tags,
                }));
            article_models = ['a', 'b', 'c', 'd'].map(tag =>
                new ArticleObjectModel.ArticleObjectModel({ tags: [tag] }));

            module.RESULTS_BATCH_SIZE = 2;

            engine = MockEngine.mock_default();
            engine.get_objects_by_query_finish.and.callFake(() => {
                let calls = engine.get_objects_by_query_finish.calls.count();
                if (calls > 2)
                    return [[], null];
                if (calls > 1)
                    return [article_models.slice(module.RESULTS_BATCH_SIZE), null];
                return [article_models.slice(0, module.RESULTS_BATCH_SIZE),
                    'get more results query'];
            });

            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: set_models,
            });

            arrangements = factory.get_created_named_mocks('arrangement');
            headers = factory.get_created_named_mocks('set-card');
        });

        it('adds arrangements for each dispatched set', function () {
            expect(arrangements.length).toBe(set_models.length + 1);
            // one for the featured cards
        });

        it('adds header cards for each dispatched set', function () {
            expect(headers.length).toBe(set_models.length);
        });

        it('puts cards for all the articles into the featured arrangement', function () {
            expect(featured.get_cards().length).toBe(article_models.length);
            expect(factory.get_created_named_mocks('article-card').length)
                .not.toBeLessThan(article_models.length);
        });

        it('sorts cards for all the articles into the other arrangements', function () {
            // This is tenuous because it assumes the arrangements are all
            // created in the order they're specified in the payload
            let a_cards = arrangements[1].get_cards();
            expect(a_cards.length).toBe(1);
            expect(a_cards[0].model.tags).toEqual(['a']);

            let b_cards = arrangements[2].get_cards();
            expect(b_cards.length).toBe(1);
            expect(b_cards[0].model.tags).toEqual(['b']);

            let cd_cards = arrangements[3].get_cards();
            expect(cd_cards.length).toBe(2);
            expect(cd_cards.map(card => card.model)).toEqual(jasmine.arrayContaining([
                jasmine.objectContaining({ tags: ['c'] }),
                jasmine.objectContaining({ tags: ['d'] }),
            ]));
        });

        it('clears items but leaves the sets', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_ITEMS,
            });
            let cards = factory.get_created_named_mocks('article-card');
            arrangements.forEach(arrangement =>
                expect(module).toHaveDescendant(arrangement));
            headers.forEach(header => expect(module).toHaveDescendant(header));
            cards.forEach(card => expect(module).not.toHaveDescendant(card));
        });

        it('clears the arrangements except for the featured one', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_SETS,
            });
            expect(featured.get_cards().length).toBe(article_models.length);
            expect(module).toHaveDescendant(featured);

            arrangements.filter(arrangement => arrangement !== featured)
                .forEach(arrangement => expect(module).not.toHaveDescendant(arrangement));
            headers.forEach(header => expect(module).not.toHaveDescendant(header));
        });

        describe('when clicking', function () {
            it('on the header card, dispatches set-clicked', function () {
                let header = factory.get_created_named_mocks('set-card')[0];
                header.emit('clicked');
                Utils.update_gui();
                expect(dispatcher.last_payload_with_type(Actions.SET_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: set_models[0] }));
            });

            it('on the card in the featured arrangement, dispatches item-clicked', function () {
                let card = featured.get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: card.model }));
            });

            it('on the card in another arrangement, dispatches item-clicked', function () {
                let card = arrangements[1].get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: card.model }));
            });
        });
    });

    it('does not add arrangements for featured sets', function () {
        let models = [true, true, false].map(featured =>
            new SetObjectModel.SetObjectModel({ featured: featured }));
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        let arrangements = factory.get_created_named_mocks('arrangement');
        expect(arrangements.length).toBe(2);
        // one for featured cards, one for non-featured set
    });
});
