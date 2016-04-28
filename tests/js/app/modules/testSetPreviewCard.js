// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const StyleClasses = imports.app.styleClasses;
const SetPreviewCard = imports.app.modules.setPreviewCard;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Set Preview card widget', function () {
    let card, factory, engine, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();

        engine = MockEngine.mock_default();
        engine.get_objects_by_query.and.callFake((query, cancellable, callback) => {
            callback(engine);
        });
        let mock_models = [1, 2, 3].map(num => new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://test/' + num,
        }));
        engine.get_objects_by_query_finish.and.returnValue([mock_models, null]);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement, {
            'card-type': 'article-card',
        });
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('header-card', Minimal.MinimalCard);
        factory.add_named_mock('preview-card-module', SetPreviewCard.SetPreviewCard, {
            'arrangement': 'arrangement',
            'header-card-type': 'header-card',
        });
        card = factory.create_named_module('preview-card-module', {
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('sets label', function () {
        let card = factory.create_named_module('preview-card-module', {
            model: new ContentObjectModel.ContentObjectModel({
                title: 'Hello world',
            }),
        });
        expect(Gtk.test_find_label(card, 'Hello world')).toBeTruthy();
    });

    describe('after loading content', function () {
        beforeEach(function (done) {
            card.load_content(done);
        });

        it('queries the set when instructed to', function () {
            expect(engine.get_objects_by_query).toHaveBeenCalled();
            expect(engine.get_objects_by_query_finish).toHaveBeenCalled();
            expect(factory.get_created_named_mocks('article-card').length).toEqual(3);
        });

        it('clears its cards when clear-items is dispatched', function () {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_ITEMS,
            });
            Utils.update_gui();
            let support_cards = factory.get_created_named_mocks('article-card');
            support_cards.forEach(widget => expect(card).not.toHaveDescendant(widget));
        });

        it('dispatches set-clicked when the title card is clicked', function () {
            let header = factory.get_created_named_mocks('header-card')[0];
            header.emit('clicked');
            Utils.update_gui();
            let payload = dispatcher.last_payload_with_type(Actions.SET_CLICKED);
            let matcher = jasmine.objectContaining({
                model: card.model,
                context_label: card.model.title,
            });
            expect(payload).toEqual(matcher);
        });

        it('dispatches item-clicked when a card is clicked', function () {
            let arrangement = factory.get_created_named_mocks('arrangement')[0];
            let model = arrangement.get_models()[0];
            arrangement.emit('card-clicked', model);
            Utils.update_gui();
            let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
            let matcher = jasmine.objectContaining({
                model: model,
                context: arrangement.get_models(),
                context_label: card.model.title,
            });
            expect(payload).toEqual(matcher);
        });

        it('removes cards that are filtered out', function () {
            dispatcher.dispatch({
                action_type: Actions.FILTER_ITEMS,
                ids: ['ekn://test/1', 'ekn://test/3'],
            });
            let arrangement = factory.get_created_named_mocks('arrangement')[0];
            let support_cards = factory.get_created_named_mocks('article-card');
            expect(arrangement.get_count()).toBe(1);
            expect(card).not.toHaveDescendant(support_cards[0]);
            expect(card).toHaveDescendant(support_cards[1]);
            expect(card).not.toHaveDescendant(support_cards[2]);
        });
    });
});
