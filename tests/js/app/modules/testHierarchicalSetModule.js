// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const SetObjectModel = imports.search.setObjectModel;
const HierarchicalSetModule = imports.app.modules.hierarchicalSetModule;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Hierarchical set module', function () {
    let module, factory, dispatcher, arrangement;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement, {
            'card-type': 'article-card',
        });
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('hierarchical', HierarchicalSetModule.HierarchicalSetModule, {
            'arrangement': 'arrangement',
            'set-card-type': 'set-card',
        });
        module = factory.create_named_module('hierarchical', {
            visible: true,
        });
        arrangement = factory.get_last_created_named_mock('arrangement');
    });

    it('constructs', function () {
        expect(module).toBeDefined();
    });

    it('starts with an empty arrangement', function () {
        expect(arrangement).toBeDefined();
        expect(module).toHaveDescendant(arrangement);
        expect(arrangement.get_count()).toBe(0);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('article-card');
        expect(cards.length).toEqual(0);
        cards = factory.get_created_named_mocks('set-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching set', function () {
        let master_set, subsets, set_cards, articles, engine;

        beforeEach(function () {
            master_set = new SetObjectModel.SetObjectModel({
                child_tags: ['a', 'b', 'c'],
                title: 'Set Title',
            });
            subsets = ['e', 'f', 'g'].map(tag =>
                new SetObjectModel.SetObjectModel({
                    featured: true,
                    child_tags: [tag],
                    title: 'Set Title',
                }));

            articles = ['title1', 'title2', 'title3'].map(title =>
                new ArticleObjectModel.ArticleObjectModel({
                    title: title,
                }));

            engine = MockEngine.mock_default();
            engine.get_objects_by_query_finish.and.returnValue([subsets.concat(articles), null]);

            dispatcher.dispatch({
                action_type: Actions.SHOW_SET,
                model: master_set,
            });

            arrangement = factory.get_last_created_named_mock('arrangement');
            set_cards = factory.get_created_named_mocks('set-card');
        });

        it('makes a request for objects of this set', function () {
            expect(engine.get_objects_by_query)
            .toHaveBeenCalledWith(jasmine.objectContaining({
                tags: ['a', 'b', 'c'],
                limit: jasmine.any(Number),
            }), jasmine.any(Object), jasmine.any(Function));
        });

        it('creates set cards when receiving set models', function () {
            expect(set_cards.length).toBe(subsets.length);
        });

        it('adds article cards when receiving article models', function () {
            expect(arrangement.get_count()).toBe(articles.length);
        });

        it('clears all items but leaves title and arrangement', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_ITEMS,
            });
            let cards = factory.get_created_named_mocks('article-card');
            let set_cards = factory.get_created_named_mocks('set-card');
            expect(module).toHaveDescendant(arrangement);

            set_cards.forEach(set_card => expect(module).not.toHaveDescendant(set_card));
            cards.forEach(card => expect(module).not.toHaveDescendant(card));
        });

        it('acknowledges when the set is ready', function () {
            expect(dispatcher.last_payload_with_type(Actions.SET_READY))
                .toBeDefined();
        });

        it('acknowledges when content had been added', function () {
            expect(dispatcher.last_payload_with_type(Actions.CONTENT_ADDED))
                .toBeDefined();
        });

        describe('when clicking', function () {
            it('on a card in an arrangement, dispatches item-clicked', function () {
                let model = arrangement.get_models()[0];
                arrangement.emit('card-clicked', model);
                Utils.update_gui();
                let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                expect(payload.context_label).toEqual("Set Title");
                expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                    .toEqual(jasmine.objectContaining({ model: model }));
            });
        });

        describe('showing more content', function () {
            let set_card;
            beforeEach(function () {
                set_card = set_cards[0];
                spyOn(set_card, 'load_content');
            });

            it('calls load_content', function () {
                module.show_more_content();
                expect(set_card.load_content).toHaveBeenCalled();
            });
        });
    });
});
