// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const HighlightsModule = imports.app.modules.highlightsModule;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
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
        let cards = factory.get_created_named_mocks('set-card');
        expect(cards.length).toEqual(0);
    });

    describe('after dispatching sets', function () {
        beforeEach(function () {
            let models = [['a'], ['b'], ['c', 'd']].map(tags =>
                new SetObjectModel.SetObjectModel({
                    featured: false,
                    child_tags: tags,
                }));
            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: models,
            });
        });

        it('adds arrangements for each dispatched set', function () {
            let arrangements = factory.get_created_named_mocks('arrangement');
            expect(arrangements.length).toBe(4);  // one for the featured cards
        });

        it('adds header cards for each dispatched set', function () {
            let headers = factory.get_created_named_mocks('set-card');
            expect(headers.length).toBe(3);
        });

        describe('and articles', function () {
            beforeEach(function () {
                let models = ['a', 'b', 'c', 'd'].map(tag =>
                    new ArticleObjectModel.ArticleObjectModel({ tags: [tag] }));
                dispatcher.dispatch({
                    action_type: Actions.APPEND_ITEMS,
                    models: models,
                });
            });

            it('puts cards for all the articles into the featured arrangement', function () {
                expect(featured.get_cards().length).toBe(4);
                expect(factory.get_created_named_mocks('article-card').length)
                    .not.toBeLessThan(4);
            });

            it('sorts cards for all the articles into the other arrangements', function () {
                // This is tenuous because it assumes the arrangements are all
                // created in the order they're specified in the payload
                let arrangements = factory.get_created_named_mocks('arrangement');
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
                let arrangements = factory.get_created_named_mocks('arrangement');
                let headers = factory.get_created_named_mocks('set-card');
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
                expect(featured.get_cards().length).toBe(4);
                expect(module).toHaveDescendant(featured);

                let arrangements = factory.get_created_named_mocks('arrangement');
                let headers = factory.get_created_named_mocks('set-card');
                arrangements.filter(arrangement => arrangement !== featured)
                    .forEach(arrangement => expect(module).not.toHaveDescendant(arrangement));
                headers.forEach(header => expect(module).not.toHaveDescendant(header));
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

    describe('when clicking', function () {
        let set_model, article_model;

        beforeEach(function () {
            set_model = new SetObjectModel.SetObjectModel({
                child_tags: ['a'],
            });
            article_model = new ArticleObjectModel.ArticleObjectModel({
                tags: ['a'],
            });
            dispatcher.dispatch({
                action_type: Actions.APPEND_SETS,
                models: [set_model],
            });
            dispatcher.dispatch({
                action_type: Actions.APPEND_ITEMS,
                models: [article_model],
            });
        });

        it('on the header card, dispatches set-clicked', function () {
            let header = factory.get_created_named_mocks('set-card')[0];
            header.emit('clicked');
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.SET_CLICKED))
                .toEqual(jasmine.objectContaining({ model: set_model }));
        });

        it('on the card in the featured arrangement, dispatches item-clicked', function () {
            let card = featured.get_cards()[0];
            card.emit('clicked');
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                .toEqual(jasmine.objectContaining({ model: article_model }));
        });

        it('on the card in another arrangement, dispatches item-clicked', function () {
            let card = factory.get_created_named_mocks('arrangement')[1].get_cards()[0];
            card.emit('clicked');
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
                .toEqual(jasmine.objectContaining({ model: article_model }));
        });
    });
});
