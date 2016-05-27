// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const Set = imports.app.modules.banner.set;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Banner.Set', function () {
    let module, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        [module, factory] = MockFactory.setup_tree({
            type: Set.Set,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    it('creates a card when show-set is dispatched', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: model,
        });
        let card = factory.get_last_created('card');
        expect(card.model).toBe(model);
        expect(module).toHaveDescendant(card);
    });

    it('creates a new card each show-set', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: model,
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: model,
        });
        expect(factory.get_created('card').length).toBe(2);
    });
});
