// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SetGroupModule = imports.app.modules.setGroupModule;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Set group module', function () {
    let group, arrangement, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('set-group', SetGroupModule.SetGroupModule, {
            arrangement: 'test-arrangement',
            card_type: 'home-card',
        });
        group = new SetGroupModule.SetGroupModule({
            factory: factory,
            factory_name: 'set-group',
        });
        arrangement = factory.get_created_named_mocks('test-arrangement')[0];
    });

    it('constructs', function () {
        expect(group).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(group).toHaveDescendant(arrangement);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('home-card');
        expect(cards.length).toEqual(0);
    });

    it('creates cards from models and adds them to the arrangement', function () {
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.add_card(new ContentObjectModel.ContentObjectModel());
        expect(arrangement.get_cards().length).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(3);
    });

    it('clears the existing cards when clear called', function () {
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.clear();
        group.add_card(new ContentObjectModel.ContentObjectModel());
        group.add_card(new ContentObjectModel.ContentObjectModel());
        expect(arrangement.get_cards().length).toBe(2);
        expect(factory.get_created_named_mocks('home-card').length).toBe(5);
    });
});
