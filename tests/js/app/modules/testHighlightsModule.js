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
        factory.add_named_mock('arrangement1', LimitedArrangment, {
            'card-type': 'article-card',
        });
        factory.add_named_mock('arrangement2', LimitedArrangment, {
            'card-type': 'large-card',
        });
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('large-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', HighlightsModule.HighlightsModule, {
            'highlight-arrangement': 'arrangement1',
            'support-arrangement': 'arrangement2',
            'header-card-type': 'set-card',
        });
        module = factory.create_named_module('highlights', {
            'support-sets': 2,
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
        let highlight, support1, support2, headers, set_models, article_models;

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

            highlight = factory.get_created_named_mocks('arrangement1')[0];
            support1 = factory.get_created_named_mocks('arrangement2')[0];
            support2 = factory.get_created_named_mocks('arrangement2')[1];
            headers = factory.get_created_named_mocks('set-card');
        });

        it('sends the sets it is displaying, so they can be filtered', function() {
            let payloads = dispatcher.payloads_with_type(Actions.FILTER_SETS);
            expect(payloads.length).toBe(1);
        });

        it('adds one highlight arrangement and two support arrangements', function () {
            expect(factory.get_created_named_mocks('arrangement1').length).toBe(1);
            expect(factory.get_created_named_mocks('arrangement2').length).toBe(2);
        });

        it('adds two header cards', function () {
            expect(headers.length).toBe(2);
        });

        it('puts cards in the proper arrangements', function () {
            let highlight_models = highlight.get_models();
            expect(highlight_models.length).toBe(1);
            expect(highlight_models[0].tags).toEqual(['a']);

            let support1_models = support1.get_models();
            expect(support1_models.length).toBe(1);
            expect(support1_models[0].tags).toEqual(['b']);

            let support2_models = support2.get_models();
            expect(support2_models.length).toBe(2);
            expect(support2_models[0].tags).toEqual(['c']);
            expect(support2_models[1].tags).toEqual(['d']);
        });

        it('clears the arrangements when clear-sets is dispatched', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_SETS,
            });
            expect(module).not.toHaveDescendant(highlight);
            [support1, support2]
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

            it('on the card in the highlight arrangement, dispatches item-clicked', function () {
                let model = highlight.get_models()[0];
                highlight.emit('card-clicked', model);
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                let matcher = jasmine.objectContaining({
                    model: model,
                    context: highlight.get_models(),
                    context_label: 'Highlights',
                });
                expect(payload).toEqual(matcher);
            });

            it('on the card in another arrangement, dispatches item-clicked', function () {
                let model = support1.get_models()[0];
                support1.emit('card-clicked', model);
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                let matcher = jasmine.objectContaining({
                    model: model,
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
