// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const HighlightsModule = imports.app.modules.highlightsModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.tests.utils;
const UtilsApp = imports.app.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

const LimitedArrangment = new Module.Class({
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
        factory.add_named_mock('arrangement', LimitedArrangment, {
            'card-type': 'article-card',
        });
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', HighlightsModule.HighlightsModule, {
            'highlight-arrangement': 'arrangement',
            'support-card-type': 'set-card',
        });
        module = factory.create_named_module('highlights', {
            'support-sets': 2,
        });
    });

    it('constructs', function () {
        expect(module).toBeDefined();
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('set-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching sets', function () {
        let highlight, support1, support2, set_models, article_models;

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

            highlight = factory.get_created_named_mocks('arrangement')[0];
            support1 = factory.get_created_named_mocks('set-card')[0];
            support2 = factory.get_created_named_mocks('set-card')[1];
        });

        it('sends the items it is displaying, so they can be filtered', function() {
            let payloads = dispatcher.payloads_with_type(Actions.FILTER_ITEMS);
            expect(payloads.length).toBe(1);
            expect(payloads[0].ids.length).toEqual(highlight.get_card_count());
        });

        it('adds one highlight arrangement and two support arrangements', function () {
            expect(factory.get_created_named_mocks('arrangement').length).toBe(1);
            expect(factory.get_created_named_mocks('set-card').length).toBe(2);
        });

        it('puts cards in the highlight arrangement', function () {
            let highlight_models = highlight.get_models();
            expect(highlight_models.length).toBe(1);
            expect(highlight_models[0].tags).toEqual(['a']);
        });

        it('clears the arrangements when clear-sets is dispatched', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_SETS,
            });
            [highlight, support1, support2]
                .forEach(widget => expect(module).not.toHaveDescendant(widget));
        });

        it('dispatches item-clicked when clicking on a card in the highlight arrangement', function () {
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
    });

    it('handles only two sets', function () {
        let models = [1, 2].map(() => new SetObjectModel.SetObjectModel());
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(factory.get_created_named_mocks('arrangement').length).toBe(1);
        expect(factory.get_created_named_mocks('set-card').length).toBe(1);
    });

    it('handles only one set', function () {
        let models = [new SetObjectModel.SetObjectModel()];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(factory.get_created_named_mocks('arrangement').length).toBe(1);
        expect(factory.get_created_named_mocks('set-card').length).toBe(0);
    });
});
