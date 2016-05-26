// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Set = imports.app.modules.contentGroup.set;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('ContentGroup.Set', function () {
    let group, arrangement, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        [group, factory] = MockFactory.setup_tree({
            type: Set.Set,
            slots: {
                'arrangement': {
                    type: Minimal.MinimalArrangement,
                    slots: {
                        'card-type': { type: Minimal.MinimalCard },
                    },
                },
            },
        });
        arrangement = factory.get_last_created('arrangement');
    });

    it('constructs', function () {
        expect(group).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(group).toHaveDescendant(arrangement);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created('arrangement.card-type');
        expect(cards.length).toEqual(0);
    });

    it('adds dispatched cards to the arrangement', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(arrangement.get_count()).toBe(3);
        expect(factory.get_created('arrangement.card-type').length).toBe(3);
    });

    it('clears the existing cards when clear called', function () {
        let models = [
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ];
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SETS,
            models: models,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: models,
        });
        expect(arrangement.get_count()).toBe(3);
        expect(factory.get_created('arrangement.card-type').length).toBe(6);
    });

    it('dispatches set clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: [ model ],
        });
        arrangement.emit('card-clicked', model);
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.SET_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });
});

Compliance.test_card_container_fade_in_compliance(Actions.APPEND_SETS,
    Set.Set);
