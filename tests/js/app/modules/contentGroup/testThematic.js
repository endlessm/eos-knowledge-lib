// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SetObjectModel = imports.search.setObjectModel;
const Thematic = imports.app.modules.contentGroup.thematic;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('ContentGroup.Thematic', function () {
    let module, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        [, factory] = MockFactory.setup_tree({
            type: MockWidgets.MockScrolledLayout,
            id: 'theme-scroll',
            slots: {
                'content': {
                    type: Thematic.Thematic,
                    references: {
                        'scroll-server': 'theme-scroll',
                    },
                    slots: {
                        'arrangement': {
                            type: Minimal.MinimalArrangement,
                            slots: {
                                'card': { type: Minimal.MinimalCard },
                            },
                        },
                        'header-card': { type: Minimal.MinimalCard },
                    },
                },
            },
        });
        module = factory.get_last_created('content');
        module.show();
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created('content.arrangement.card');
        expect(cards.length).toEqual(0);
        cards = factory.get_created('content.header-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching sets', function () {
        let set_models, featured_models, non_featured_models, arrangements,
            headers;

        beforeEach(function () {
            non_featured_models = [['a'], ['c', 'd'], ['d'], ['h']].map(tags =>
                new SetObjectModel.SetObjectModel({
                    featured: false,
                    child_tags: tags,
                    title: 'Set Title',
                }));
            featured_models = ['e', 'f', 'g'].map(tag =>
                new SetObjectModel.SetObjectModel({
                    featured: true,
                    child_tags: [tag],
                    title: 'Set Title',
                }));
            set_models = non_featured_models.concat(featured_models);

            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: set_models,
            });

            arrangements = factory.get_created('content.arrangement');
            headers = factory.get_created('content.header-card');
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
                    let task = query.tags_match_all.slice();
                    callback(engine, task);
                    return task;
                });
                engine.get_objects_by_query_finish.and.callFake((task) => {
                    let results = article_models.filter(model =>
                            task.filter(tag => model.tags.indexOf(tag) < 0).length === 0);
                    return [results, { more_results: null }];
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
                    let arrs = arrangements.filter(arrangement => arrangement.visible);
                    // Should only show 1 arrangement to start with
                    expect(arrs.length).toBe(1);

                    let model = arrs[0].get_models()[0];
                    expect(model.tags).toContain('a');
                    expect(model.tags).toContain('e');
                    let visible_headers = headers.filter(header => header.is_visible());
                    expect(visible_headers.length).toBe(1);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeFalsy());
                });

                it('sorts cards for all the articles into the arrangements', function () {
                    // This is tenuous because it assumes the arrangements are all
                    // created in the order they're specified in the payload
                    let a_models = arrangements[0].get_models();
                    expect(a_models.length).toBe(1);
                    expect(a_models[0].tags).toEqual(article_models[0].tags);

                    // Now load the next arrangement
                    module.show_more_content();
                    let bc_models = arrangements[1].get_models();
                    expect(bc_models.length).toBe(2);
                    expect(bc_models).toEqual(jasmine.arrayContaining([
                        jasmine.objectContaining({ tags: article_models[2].tags }),
                        jasmine.objectContaining({ tags: article_models[3].tags }),
                    ]));

                    // Load third arrangement
                    module.show_more_content();
                    let d_models = arrangements[2].get_models();
                    // All cards have 'd' and 'e' tags so all should show up in this arrangement
                    expect(d_models.length).toBe(6);
                    expect(d_models).toEqual(article_models);
                });

                it('clears items but leaves the sets', function () {
                    dispatcher.dispatch({
                        action_type: Actions.CLEAR_ITEMS,
                    });
                    let cards = factory.get_created('content.arrangement.card');
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
                        let model = arrangements[0].get_models()[0];
                        arrangements[0].emit('card-clicked', model);
                        Utils.update_gui();
                        let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
                        expect(payload.context_label).toEqual("Set Title");
                        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                            .toEqual(jasmine.objectContaining({ model: model }));
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
                        .toBe(1);
                    let visible_headers = headers.filter(header => header.is_visible());
                    expect(visible_headers.length).toBe(1);
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
                        expect(arrangement.get_count()).toBeGreaterThan(0);
                    });
                    let visible_headers = headers.filter(header => header.is_visible());
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
                    let visible_headers = headers.filter(header => header.is_visible());
                    expect(visible_headers.length).toBe(visible_arrangements.length);
                    visible_headers.forEach(header =>
                        expect(header.model.featured).toBeTruthy());
                });
            });
        });
    });
});
