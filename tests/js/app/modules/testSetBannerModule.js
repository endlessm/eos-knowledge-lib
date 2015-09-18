// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const SetBannerModule = imports.app.modules.setBannerModule;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('SetBannerModule module', function () {
    let module, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-card', Minimal.MinimalCard);
        factory.add_named_mock('set-banner-module', SetBannerModule.SetBannerModule,
        {
            'card_type': 'mock-card',
        });

        module = new SetBannerModule.SetBannerModule({
            factory: factory,
            factory_name: 'set-banner-module',
        });
    });

    it('constructs', function () {});

    it('creates a card when show-set is dispatched', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: model,
        });
        let card = factory.get_created_named_mocks('mock-card')[0];
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
        expect(factory.get_created_named_mocks('mock-card').length).toBe(2);
    });
});
