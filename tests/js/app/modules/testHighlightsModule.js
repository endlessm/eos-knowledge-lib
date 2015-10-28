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
const UtilsApp = imports.app.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Highlights module', function () {
    let module, featured, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement1', Minimal.MinimalArrangement);
        factory.add_named_mock('arrangement2', Minimal.MinimalArrangement);
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', HighlightsModule.HighlightsModule, {
            'large-arrangement': 'arrangement1',
            'small-arrangement': 'arrangement2',
            'card-type': 'article-card',
            'header-card-type': 'set-card',
        });
        module = new HighlightsModule.HighlightsModule({
            factory: factory,
            factory_name: 'highlights',
        });
        featured = factory.get_created_named_mocks('arrangement1')[0];

        // De-randomize
        spyOn(UtilsApp, 'shuffle').and.callFake(array => array);
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
        let theme1, theme2, headers, set_models, article_models, engine;

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

            theme1 = factory.get_created_named_mocks('arrangement2')[0];
            theme2 = factory.get_created_named_mocks('arrangement1')[1];
            headers = factory.get_created_named_mocks('set-card');
        });

        it('adds two arrangements', function () {
            expect(factory.get_created_named_mocks('arrangement1').length).toBe(2);
            // (2, because one is for the featured cards)
            expect(factory.get_created_named_mocks('arrangement2').length).toBe(1);
        });

        it('adds two header cards', function () {
            expect(headers.length).toBe(2);
        });

        it('puts cards for all the articles into the featured arrangement', function () {
            expect(featured.get_cards().length).toBe(article_models.length);
            expect(factory.get_created_named_mocks('article-card').length)
                .not.toBeLessThan(article_models.length);
        });

        it('sorts cards for all the articles into the other arrangements', function () {
            let a_cards = theme1.get_cards();
            expect(a_cards.length).toBe(1);
            expect(a_cards[0].model.tags).toEqual(['a']);

            let b_cards = theme2.get_cards();
            expect(b_cards.length).toBe(1);
            expect(b_cards[0].model.tags).toEqual(['b']);
        });

        it('clears items but leaves the sets', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_ITEMS,
            });
            let cards = factory.get_created_named_mocks('article-card');
            [theme1, theme2].forEach(arrangement =>
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

            [theme1, theme2]
                .forEach(arrangement => expect(module).not.toHaveDescendant(arrangement));
            headers.forEach(header => expect(module).not.toHaveDescendant(header));
        });

        describe('when clicking', function () {
            it('on the header card, dispatches set-clicked', function () {
                let header = factory.get_created_named_mocks('set-card')[0];
                header.emit('clicked');
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.SET_CLICKED);
                let matcher = jasmine.objectContaining({
                    model: set_models[0],
                    context: set_models.slice(0, 2),
                });
                expect(payload).toEqual(matcher);
            });

            it('on the card in the featured arrangement, dispatches item-clicked', function () {
                let card = featured.get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: card.model }));
            });

            it('on the card in another arrangement, dispatches item-clicked', function () {
                let card = theme1.get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: card.model }));
            });
        });
    });

    it('does not add arrangements for featured sets', function () {
        let models = [true, true, false, false].map(featured =>
            new SetObjectModel.SetObjectModel({ featured: featured }));
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        let arrangements = factory.get_created_named_mocks('arrangement1')
            .concat(factory.get_created_named_mocks('arrangement2'));
        expect(arrangements.length).toBe(3);
        // one for featured cards, two for non-featured sets
    });
});
