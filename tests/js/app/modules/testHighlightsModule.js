// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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

const LimitedArrangment = new Lang.Class({
    Name: 'LimitedArrangment',
    Extends: Minimal.MinimalArrangement,

    get_max_cards: function () {
        return 2;
    },
});


describe('Highlights module', function () {
    let module, factory, dispatcher, engine;

    beforeEach(function () {
        // De-randomize
        spyOn(UtilsApp, 'shuffle').and.callFake(array => array.slice());

        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();

        engine.get_objects_by_query_finish.and.returnValue([[], null]);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement1', LimitedArrangment);
        factory.add_named_mock('arrangement2', LimitedArrangment);
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('large-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', HighlightsModule.HighlightsModule, {
            'large-arrangement': 'arrangement1',
            'small-arrangement': 'arrangement2',
            'card-type': 'article-card',
            'header-card-type': 'set-card',
            'large-card-type': 'large-card',
        });
        module = new HighlightsModule.HighlightsModule({
            factory: factory,
            factory_name: 'highlights',
        });
    });

    it('constructs', function () {
        expect(module).toBeDefined();
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('article-card');
        expect(cards.length).toEqual(0);
        cards = factory.get_created_named_mocks('set-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching sets', function () {
        let featured, theme1, theme2, headers, set_models, article_models;

        beforeEach(function () {
            set_models = [['a'], ['b'], ['c', 'd']].map(tags =>
                new SetObjectModel.SetObjectModel({
                    featured: false,
                    child_tags: tags,
                }));
            article_models = ['a', 'b', 'c', 'd'].map(tag =>
                new ArticleObjectModel.ArticleObjectModel({ tags: [tag] }));

            engine.get_objects_by_query.and.callFake((query, cancellable, callback) => {
                callback(engine, query.tags);
            });
            engine.get_objects_by_query_finish.and.callFake((tags) => {
                let matches = (model, tags) => tags.some(tag => model.tags.indexOf(tag) > -1);
                return [article_models.filter(model => matches(model, tags)), null];
            });

            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: set_models,
            });

            featured = factory.get_created_named_mocks('arrangement1')[0];
            theme1 = factory.get_created_named_mocks('arrangement2')[0];
            theme2 = factory.get_created_named_mocks('arrangement1')[1];
            headers = factory.get_created_named_mocks('set-card');
        });

        it('adds three arrangements', function () {
            expect(factory.get_created_named_mocks('arrangement1').length).toBe(2);
            // (2, because one is for the featured cards)
            expect(factory.get_created_named_mocks('arrangement2').length).toBe(1);
        });

        it('adds two header cards', function () {
            expect(headers.length).toBe(2);
        });

        it('puts cards in the proper arrangements', function () {
            let featured_cards = featured.get_cards();
            expect(featured_cards.length).toBe(1);
            expect(featured_cards[0].model.tags).toEqual(['a']);

            let theme1_cards = theme1.get_cards();
            expect(theme1_cards.length).toBe(1);
            expect(theme1_cards[0].model.tags).toEqual(['b']);

            let theme2_cards = theme2.get_cards();
            expect(theme2_cards.length).toBe(2);
            expect(theme2_cards[0].model.tags).toEqual(['c']);
            expect(theme2_cards[1].model.tags).toEqual(['d']);
        });

        it('clears the arrangements when clear-sets is dispatched', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_SETS,
            });
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
                    model: header.model,
                    context: set_models,
                });
                expect(payload).toEqual(matcher);
            });

            it('on the card in the featured arrangement, dispatches item-clicked', function () {
                let card = featured.get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                let matcher = jasmine.objectContaining({
                    model: card.model,
                    context: featured.get_cards().map(card => card.model),
                    context_label: 'Highlights',
                });
                expect(payload).toEqual(matcher);
            });

            it('on the card in another arrangement, dispatches item-clicked', function () {
                let card = theme1.get_cards()[0];
                card.emit('clicked');
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                let matcher = jasmine.objectContaining({
                    model: card.model,
                    context: article_models.filter((model) => model.tags[0] === 'b'),
                });
                expect(payload).toEqual(matcher);
            });
        });
    });

    it('does not add arrangements for featured sets', function () {
        let models = [true, true, false, false, false].map(featured =>
            new SetObjectModel.SetObjectModel({ featured: featured }));
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        let headers = factory.get_created_named_mocks('set-card');
        headers.forEach(header => expect(header.model.featured).toBe(false));
    });

    it('handles only two sets', function () {
        let models = [1, 2].map(() => new SetObjectModel.SetObjectModel());
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(factory.get_created_named_mocks('arrangement1').length).toBe(1);
        expect(factory.get_created_named_mocks('arrangement2').length).toBe(1);
    });

    it('handles only one set', function () {
        let models = [new SetObjectModel.SetObjectModel()];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(factory.get_created_named_mocks('arrangement1').length).toBe(1);
        expect(factory.get_created_named_mocks('arrangement2').length).toBe(0);
    });

    it('only creates as many cards as necessary', function () {
        let set_models = [1, 2, 3].map(() => new SetObjectModel.SetObjectModel());
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: set_models,
        });
        expect(engine.get_objects_by_query.calls.count()).toBe(3);
        engine.get_objects_by_query.calls.allArgs().forEach((args) => {
            expect(args[0].limit).toBe(2);
        });
    });
});
