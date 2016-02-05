// Copyright 2015 Endless Mobile, Inc.

/* exported MinimalArrangement, MinimalBackCover, MinimalCard, MinimalDocumentCard,
MinimalPage, MinimalHomePage, MinimalInteraction, MinimalBinModule, MinimalModule,
test_arrangement_compliance, test_card_container_compliance,
test_card_highlight_string_compliance */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const DocumentCard = imports.app.interfaces.documentCard;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Module = imports.app.interfaces.module;
const Scrollable = imports.app.interfaces.scrollable;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const Utils = imports.tests.utils;

const MinimalArrangement = new Lang.Class({
    Name: 'MinimalArrangement',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'transition-duration': GObject.ParamSpec.uint('transition-duration', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 1),
        'all-visible': GObject.ParamSpec.override('all-visible',
            Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this.parent(props);
        this.show_all();
    },

    set_transition_type: function (type) {
        this._type = type;
    },

    get_transition_type: function () {
        return this._type;
    },

    set_visible_child: function (child) {
        this._child = child;
    },

    get_visible_child: function () {
        return this._child;
    },
});

const MinimalCard = new Lang.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
        // For test_card_container_compliance() below
        spyOn(this, 'fade_in').and.callThrough();
    },

    load_content: function () {},

    vfunc_size_allocate: function (allocation) {
        this.parent(allocation);
        this.update_card_sizing_classes(allocation.height, allocation.width);
    },
});

const MinimalScrollable = new Lang.Class({
    Name: 'MinimalScrollable',
    Extends: GObject.Object,
    Implements: [ Module.Module, Scrollable.Scrollable ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'scroll-server': GObject.ParamSpec.override('scroll-server', Scrollable.Scrollable),
    },

    _init: function (props={}) {
        this.parent(props);
        this.scrollable_init();
    },

    show_more_content: function () {},
});

const MinimalInteraction = new Lang.Class({
    Name: 'MinimalInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    desktop_launch: function () {},
});

const MinimalPage = new Lang.Class({
    Name: 'MinimalPage',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        this.show_all();
    },
});

const MinimalBackCover = new Lang.Class({
    Name: 'MinimalBackCover',
    Extends: Gtk.Widget,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'progress-label': GObject.ParamSpec.object('progress-label', 'Progress label',
            '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gtk.Widget),
    },

    _init: function (props={}) {
        props.progress_label = props.progress_label || new Gtk.Label();
        this.parent(props);
    },
});

const MinimalModule = new Lang.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});

const MinimalDocumentCard = new Lang.Class({
    Name: 'MinimalDocumentCard',
    Extends: Gtk.Widget,
    Implements: [ Module.Module, Card.Card, DocumentCard.DocumentCard ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'content-view': GObject.ParamSpec.override('content-view', DocumentCard.DocumentCard),
        'custom-css': GObject.ParamSpec.override('custom-css',
            DocumentCard.DocumentCard),
        'info-notice': GObject.ParamSpec.object('info-notice', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            Gtk.Widget),
        'show-toc': GObject.ParamSpec.boolean('show-toc', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'show-top-title': GObject.ParamSpec.boolean('show-top-title', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'previous-card': GObject.ParamSpec.object('previous-card',
            'Previous Card', 'Previous Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        'next-card': GObject.ParamSpec.object('next-card',
            'Next Card', 'Next Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'archived': GObject.ParamSpec.boolean('archived', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this.parent(props);
        this.toc = {
            connect: function () {},
        };
        this.content_view = {
            grab_focus: function () {},
            connect: function () {},
        };
    },

    load_content: function (cancellable, callback) { callback(this); },
    load_content_finish: function () {},
    clear_content: function () {},
});

const MinimalBinModule = new Lang.Class({
    Name: 'MinimalBinModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },
});

function test_card_highlight_string_compliance(CardClass) {
    describe(CardClass.$gtype.name + ' implements the optional highlighting part of Card', function () {
        let model, card;

        beforeEach(function () {
            model = new ContentObjectModel.ContentObjectModel({
                title: '!!! containing hippo',
                synopsis: '@@@ synopsis also containing hippo',
            });
            card = new CardClass({
                model: model,
                highlight_string: 'hippo',
            });
        });
        it('by highlighting a search string when constructed', function () {
            expect(Gtk.test_find_label(card, '*!!!*').label).toMatch(/<span.*>hippo<\/span>/i);
            expect(Gtk.test_find_label(card, '*@@@*').label).toMatch(/<span.*>hippo<\/span>/i);
        });

        it('by de-highlighting a search string', function () {
            card.highlight_string = '';
            expect(Gtk.test_find_label(card, '*!!!*').label).toMatch(/ hippo$/i);
            expect(Gtk.test_find_label(card, '*@@@*').label).toMatch(/ hippo$/i);
        });

        it('by highlighting a search string', function () {
            card = new CardClass({ model: model });
            card.highlight_string = 'hippo';
            expect(Gtk.test_find_label(card, '*!!!*').label).toMatch(/<span.*>hippo<\/span>/i);
            expect(Gtk.test_find_label(card, '*@@@*').label).toMatch(/<span.*>hippo<\/span>/i);
        });
    });
}

function test_arrangement_compliance(ArrangementClass, extra_slots={}) {
    describe(ArrangementClass.$gtype.name + ' implements Arrangement correctly', function () {
        let factory, arrangement;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            factory = new MockFactory.MockFactory();
            factory.add_named_mock('card', MinimalCard);
            let slots = {
                'card-type': 'card',
            };
            for (let slot in extra_slots) {
                factory.add_named_mock(slot, extra_slots[slot]);
                slots[slot] = slot;
            }
            factory.add_named_mock('arrangement', ArrangementClass, slots);
            arrangement = factory.create_named_module('arrangement');
        });

        it('by constructing', function () {
            expect(arrangement).toBeDefined();
        });

        function add_cards(a, ncards) {
            let models = [];
            for (let ix = 0; ix < ncards; ix++) {
                let model = new ContentObjectModel.ContentObjectModel();
                a.add_model(model);
                models.push(model);
            }
            Utils.update_gui();
            let created_cards = factory.get_created_named_mocks('card');
            let cards = models.map(model => created_cards.filter(card => card.model === model)[0]);
            return cards.slice(cards.length - ncards);
        }

        it('by adding cards to the list', function () {
            let cards = add_cards(arrangement, 3);

            cards.forEach((card) =>
                expect(arrangement).toHaveDescendant(card));
            expect(arrangement.get_models().length).toBe(3);
        });

        it('by removing cards from the list', function () {
            let cards = add_cards(arrangement, 3);
            arrangement.clear();
            Utils.update_gui();

            cards.forEach((card) =>
                expect(arrangement).not.toHaveDescendant(card));
            expect(arrangement.get_models().length).toBe(0);
        });

        it('by being able to remove individual cards', function () {
            let cards = add_cards(arrangement, 3);
            let models = arrangement.get_models();
            arrangement.remove_model(models[1]);
            Utils.update_gui();

            expect(arrangement.get_models().length).toBe(2);
            expect(arrangement).toHaveDescendant(cards[0]);
            expect(arrangement).not.toHaveDescendant(cards[1]);
            expect(arrangement).toHaveDescendant(cards[2]);
        });

        it('by retrieving the contained models', function () {
            let cards = add_cards(arrangement, 3);

            cards.forEach(card =>
                expect(arrangement.get_models()).toContain(card.model));
        });

        it('by returning the card corresponding to a model', function () {
            let model1 = new ContentObjectModel.ContentObjectModel();
            let model2 = new ContentObjectModel.ContentObjectModel();
            arrangement.add_model(model1);
            arrangement.add_model(model2);
            expect(arrangement.get_card_for_model(model1).model).toBe(model1);
            expect(arrangement.get_card_for_model(model2).model).toBe(model2);
        });

        it('by returning a card as it is created', function () {
            let model1 = new ContentObjectModel.ContentObjectModel();
            let model2 = new ContentObjectModel.ContentObjectModel();
            let card1 = arrangement.add_model(model1);
            let card2 = arrangement.add_model(model2);
            expect(card1.model).toBe(model1);
            expect(card2.model).toBe(model2);
        });

        it('by highlighting strings as cards are added', function () {
            arrangement.highlight_string('foo');
            let card = add_cards(arrangement, 1)[0];
            expect(card.highlight_string).toEqual('foo');
        });

        it('by highlighting strings on existing cards', function () {
            let card = add_cards(arrangement, 1)[0];
            expect(card.highlight_string).not.toEqual('foo');
            arrangement.highlight_string('foo');
            expect(card.highlight_string).toEqual('foo');
        });
    });
}

function test_card_container_compliance(action, CardContainerClass, extra_slots={}) {
    describe(CardContainerClass.$gtype.name + ' implements CardContainer correctly', function () {
        let factory, dispatcher;

        beforeEach(function () {
            dispatcher = MockDispatcher.mock_default();
            factory = new MockFactory.MockFactory();

            factory.add_named_mock('card', MinimalCard);
            factory.add_named_mock('arrangement', MinimalArrangement, {
                'card-type': 'card',
            });
            let slots = {
                'arrangement': 'arrangement',
            };
            for (let slot in extra_slots) {
                factory.add_named_mock(slot, extra_slots[slot]);
                slots[slot] = slot;
            }
            factory.add_named_mock('card-container', CardContainerClass, slots);
        });

        describe('when requested to fade in', function () {
            let arrangement;

            beforeEach(function () {
                factory.create_named_module('card-container', {
                    fade_cards: true,
                });
                arrangement = factory.get_last_created_named_mock('arrangement');
            });

            it('does not fade in the first batch of cards', function () {
                let model = new ContentObjectModel.ContentObjectModel();
                dispatcher.dispatch({
                    action_type: action,
                    models: [model],
                });
                Utils.update_gui();
                expect(arrangement.get_card_for_model(model).fade_in)
                    .not.toHaveBeenCalled();
            });

            it('does so otherwise when requested', function () {
                let model = new ContentObjectModel.ContentObjectModel();
                dispatcher.dispatch({
                    action_type: action,
                    models: [model],
                });
                Utils.update_gui();
                expect(arrangement.get_card_for_model(model).fade_in)
                    .not.toHaveBeenCalled();
                model = new ContentObjectModel.ContentObjectModel();
                dispatcher.dispatch({
                    action_type: action,
                    models: [model],
                });
                Utils.update_gui();
                expect(arrangement.get_card_for_model(model).fade_in)
                    .toHaveBeenCalled();
            });
        });

        it('does not fade in when not requested to', function () {
            factory.create_named_module('card-container', {
                fade_cards: false,
            });
            let arrangement = factory.get_last_created_named_mock('arrangement');
            let model = new ContentObjectModel.ContentObjectModel();
            dispatcher.dispatch({
                action_type: action,
                models: [model],
            });
            Utils.update_gui();
            expect(arrangement.get_card_for_model(model).fade_in)
                .not.toHaveBeenCalled();
            model = new ContentObjectModel.ContentObjectModel();
            dispatcher.dispatch({
                action_type: action,
                models: [model],
            });
            Utils.update_gui();
            expect(arrangement.get_card_for_model(model).fade_in)
                .not.toHaveBeenCalled();
        });
    });
}
