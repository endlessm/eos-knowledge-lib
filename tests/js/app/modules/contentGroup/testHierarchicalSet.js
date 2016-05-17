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
const MockWidgets = imports.tests.mockWidgets;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;
const HierarchicalSet = imports.app.modules.contentGroup.hierarchicalSet;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Hierarchical set module', function () {
    let module, factory, dispatcher, arrangement;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_reference_mock('theme-scroll', MockWidgets.MockScrolledArrangement);
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement, {
            'card-type': 'article-card',
        });
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('set-card', Minimal.MinimalCard);
        factory.add_named_mock('hierarchical', HierarchicalSet.HierarchicalSet, {
            'arrangement': 'arrangement',
            'set-card-type': 'set-card',
        }, {
        }, {
            'scroll-server': 'theme-scroll',
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
        let master_set, subsets, set_cards, engine, scroll_server;
        let articles_in_master_set, articles_in_subset, articles_with_extra_tags;

        beforeEach(function () {
            let master_tags = ['a', 'b', 'c'];
            let subset_tags = ['e', 'f', 'g'];

            master_set = new SetObjectModel.SetObjectModel({
                child_tags: master_tags,
                title: 'Set Title',
            });
            subsets = subset_tags.map(tag =>
                new SetObjectModel.SetObjectModel({
                    featured: true,
                    child_tags: [tag],
                    title: 'Set Title',
                }));

            articles_in_master_set = ['title1', 'title2', 'title3'].map(title =>
                new ArticleObjectModel.ArticleObjectModel({
                    title: title,
                    tags: master_tags,
                }));
            articles_in_subset = ['title1', 'title2', 'title3'].map(title =>
                new ArticleObjectModel.ArticleObjectModel({
                    title: title,
                    tags: master_tags.concat('e'),
                }));
            articles_with_extra_tags = [new ArticleObjectModel.ArticleObjectModel({
                title: 'weird',
                tags: master_tags.concat('bob', 'dylan'),
            })];

            spyOn(SetMap, 'get_set_for_tag').and.callFake(tag =>
                subsets[subset_tags.indexOf(tag)]);

            engine = MockEngine.mock_default();
            engine.get_objects_by_query_finish.and.returnValue([
                subsets.concat(articles_in_master_set)
                    .concat(articles_in_subset)
                    .concat(articles_with_extra_tags),
                null]);

            module.reference_module('scroll-server', (scroll_module) => {
                scroll_server = scroll_module;
                spyOn(scroll_server, 'new_content_added');
            });

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
            expect(arrangement.get_count()).toBe(articles_in_master_set.length +
                articles_with_extra_tags.length);
        });

        it("shows articles with the master set's tags", function () {
            let shown_models = arrangement.get_models();
            articles_in_master_set.forEach(model =>
                expect(shown_models).toContain(model));
        });

        it("doesn't show articles that also have subsets' tags", function () {
            let shown_models = arrangement.get_models();
            articles_in_subset.forEach(model =>
                expect(shown_models).not.toContain(model));
        });

        it('ignores tags that are not sets', function () {
            let shown_models = arrangement.get_models();
            articles_with_extra_tags.forEach(model =>
                expect(shown_models).toContain(model));
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
            expect(scroll_server.new_content_added).toHaveBeenCalled();
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
            it('calls load_content', function () {
                module.show_more_content();
                expect(set_cards[0].load_content).toHaveBeenCalled();
            });
        });
    });
});
