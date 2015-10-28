// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const SetObjectModel = imports.search.setObjectModel;
const ThematicModule = imports.app.modules.thematicModule;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Thematic module', function () {
    let module, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('highlights', ThematicModule.ThematicModule, {
            'arrangement': 'arrangement',
            'card-type': 'article-card',
            'header-card-type': 'set-card',
        });
        module = new ThematicModule.ThematicModule({
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
        let set_models, featured_models, non_featured_models, arrangements,
            headers;

        beforeEach(function () {
            non_featured_models = [['a'], ['b', 'c'], ['d'], ['h']].map(tags =>
                new SetObjectModel.SetObjectModel({
                    featured: false,
                    child_tags: tags,
                }));
            featured_models = ['e', 'f', 'g'].map(tag =>
                new SetObjectModel.SetObjectModel({
                    featured: true,
                    child_tags: [tag],
                }));
            set_models = non_featured_models.concat(featured_models);

            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: set_models,
            });

            arrangements = factory.get_created_named_mocks('arrangement');
            headers = factory.get_created_named_mocks('set-card');
        });

        it('adds arrangements for each dispatched set', function () {
            expect(arrangements.length).toBe(set_models.length);
        });

        it('adds header cards for each dispatched set', function () {
            expect(headers.length).toBe(set_models.length);
        });

        describe('and showing', function () {
            let article_models;

            beforeEach(function () {
                let engine = MockEngine.mock_default();
                article_models = ['a', 'b', 'c', 'c', 'f', 'g'].map(tag =>
                    new ArticleObjectModel.ArticleObjectModel({
                        tags: [tag, 'd', 'e'],
                    }));
                engine.get_objects_by_query.and.callFake((query, cancel, callback) => {
                    let task = query.tags.slice();
                    callback(engine, task);
                    return task;
                });
                engine.get_objects_by_query_finish.and.callFake((task) => {
                    let results = article_models.filter(model =>
                        model.tags.some(tag => task.indexOf(tag) > -1));
                    return [results, null];
                });
            });

            describe('a featured set', function () {
                beforeEach(function () {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET,
                        model: featured_models[0],
                    });
                    Utils.update_gui();
                });

                it('shows only the non-featured arrangements', function () {
                    // The -1s are because we have a non-featured model that
                    // doesn't have any cards at all
                    expect(arrangements.filter(arrangement => arrangement.visible).length)
                        .toBe(non_featured_models.length - 1);
                    let visible_headers = headers.filter(header => header.visible);
                    expect(visible_headers.length).toBe(non_featured_models.length - 1);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeFalsy());
                });

                it('sorts cards for all the articles into the arrangements', function () {
                    // This is tenuous because it assumes the arrangements are all
                    // created in the order they're specified in the payload
                    let a_cards = arrangements[0].get_cards();
                    expect(a_cards.length).toBe(1);
                    expect(a_cards[0].model.tags).toEqual(article_models[0].tags);

                    let bc_cards = arrangements[1].get_cards();
                    expect(bc_cards.length).toBe(3);
                    expect(bc_cards.map(card => card.model)).toEqual(jasmine.arrayContaining([
                        jasmine.objectContaining({ tags: article_models[1].tags }),
                        jasmine.objectContaining({ tags: article_models[2].tags }),
                        jasmine.objectContaining({ tags: article_models[3].tags }),
                    ]));

                    let d_cards = arrangements[2].get_cards();
                    expect(d_cards.length).toBe(6);
                    expect(d_cards.map(card => card.model)).toEqual(article_models);
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

                it('clears the arrangements', function () {
                    dispatcher.dispatch({
                        action_type: Actions.CLEAR_SETS,
                    });

                    arrangements.forEach(arrangement =>
                        expect(module).not.toHaveDescendant(arrangement));
                    headers.forEach(header => expect(module).not.toHaveDescendant(header));
                });

                it('acknowledges when the set is ready', function () {
                    expect(dispatcher.last_payload_with_type(Actions.SET_READY))
                        .toBeDefined();
                });

                describe('when clicking', function () {
                    it('on the header card, dispatches set-clicked', function () {
                        dispatcher.reset();
                        headers[0].emit('clicked');
                        Utils.update_gui();
                        let payload = dispatcher.last_payload_with_type(Actions.SET_CLICKED);
                        let matcher = jasmine.objectContaining({
                            model: set_models[0],
                            context: set_models,
                        });
                        expect(payload).toEqual(matcher);
                    });

                    it('on a card in an arrangement, dispatches item-clicked', function () {
                        let card = arrangements[0].get_cards()[0];
                        card.emit('clicked');
                        Utils.update_gui();
                        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                            .toEqual(jasmine.objectContaining({ model: card.model }));
                    });
                });
            });

            describe('a non-featured set', function () {
                beforeEach(function () {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET,
                        model: non_featured_models[2],
                    });
                    Utils.update_gui();
                });

                it('shows only the featured arrangements', function () {
                    expect(arrangements.filter(arrangement => arrangement.visible).length)
                        .toBe(featured_models.length);
                    let visible_headers = headers.filter(header => header.visible);
                    expect(visible_headers.length).toBe(featured_models.length);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeTruthy());
                });
            });

            describe('a featured set that leaves empty arrangements', function () {
                beforeEach(function () {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET,
                        model: featured_models[1],
                    });
                });

                it('shows no empty arrangements', function () {
                    let visible_arrangements = arrangements.filter(arrangement => arrangement.visible);
                    visible_arrangements.forEach(arrangement => {
                        expect(arrangement.get_cards().length).toBeGreaterThan(0);
                    });
                    let visible_headers = headers.filter(header => header.visible);
                    expect(visible_headers.length).toBe(visible_arrangements.length);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeFalsy());
                });
            });

            describe('a non-featured set that leaves empty arrangements', function () {
                beforeEach(function () {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET,
                        model: non_featured_models[3],
                    });
                });

                it('shows no empty arrangements', function () {
                    let visible_arrangements = arrangements.filter(arrangement => arrangement.visible);
                    visible_arrangements.forEach(arrangement => {
                        expect(arrangement.get_cards().length).toBeGreaterThan(0);
                    });
                    let visible_headers = headers.filter(header => header.visible);
                    expect(visible_headers.length).toBe(visible_arrangements.length);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeTruthy());
                });
            });
        });
    });
});
