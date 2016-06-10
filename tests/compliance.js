// Copyright 2016 Endless Mobile, Inc.

/* exported test_arrangement_compliance, test_arrangement_fade_in_compliance,
test_card_container_fade_in_compliance, test_card_highlight_string_compliance */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const Utils = imports.tests.utils;

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

function _merge_slots_into(extra_slots, slots) {
    Lang.copyProperties(extra_slots, slots);
    return slots;
}

function test_arrangement_compliance(ArrangementClass, extra_slots={}) {
    describe(ArrangementClass.$gtype.name + ' implements Arrangement correctly', function () {
        let factory, arrangement;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            [arrangement, factory] = MockFactory.setup_tree({
                type: ArrangementClass,
                slots: _merge_slots_into(extra_slots, {
                    'card': { type: Minimal.MinimalCard },
                    'filter': { type: Minimal.TitleFilter },
                }),
            });
        });

        function add_cards(a, ncards) {
            let models = [];
            for (let ix = 0; ix < ncards; ix++) {
                let model = new ContentObjectModel.ContentObjectModel();
                models.push(model);
            }
            a.set_models(a.get_models().concat(models));
            Utils.update_gui();
            let created_cards = factory.get_created('card');
            let cards = models.map(model => created_cards.filter(card => card.model === model)[0]);
            return cards.slice(cards.length - ncards);
        }

        function add_filtered_card(a) {
            let model = new ContentObjectModel.ContentObjectModel({
                title: '0Filter me out',
            });
            a.set_models(a.get_models().concat([model]));
            return model;
        }

        it('by adding cards to the list', function () {
            let cards = add_cards(arrangement, 3);

            cards.forEach((card) =>
                expect(arrangement).toHaveDescendant(card));
            expect(arrangement.get_count()).toBe(3);
        });

        it('by removing cards from the list', function () {
            let cards = add_cards(arrangement, 3);
            arrangement.clear();
            Utils.update_gui();

            cards.forEach((card) =>
                expect(arrangement).not.toHaveDescendant(card));
            expect(arrangement.get_count()).toBe(0);
        });

        it('by being able to remove individual cards', function () {
            let cards = add_cards(arrangement, 3);
            let models = arrangement.get_models();
            arrangement.remove_model(models[1]);
            Utils.update_gui();

            expect(arrangement.get_count()).toBe(2);
            expect(arrangement).toHaveDescendant(cards[0]);
            expect(arrangement).not.toHaveDescendant(cards[1]);
            expect(arrangement).toHaveDescendant(cards[2]);
        });

        it('by retrieving the contained models', function () {
            let cards = add_cards(arrangement, 3);

            cards.forEach(card =>
                expect(arrangement.get_models()).toContain(card.model));
        });

        it('by retrieving the models in sorted order', function () {
            [arrangement, factory] = MockFactory.setup_tree({
                type: ArrangementClass,
                slots: _merge_slots_into(extra_slots, {
                    'card': { type: Minimal.MinimalCard },
                    'order': { type: Minimal.MinimalOrder },
                }),
            });

            let models = [];
            // If arrangement has max card limit, respect that, otherwise just test with 4 cards.
            let count = arrangement.get_max_cards() > -1 ? arrangement.get_max_cards() : 4;
            for (let ix = count; ix > 0; ix--) {
                let model = new ContentObjectModel.ContentObjectModel({
                    title: ix.toString(),
                });
                models.push(model);
            }
            arrangement.set_models(models);

            expect(arrangement.get_models()).toEqual(models.reverse());
        });

        it('by returning the card corresponding to a model', function () {
            let model1 = new ContentObjectModel.ContentObjectModel();
            let model2 = new ContentObjectModel.ContentObjectModel();
            arrangement.set_models([model1, model2]);
            expect(arrangement.get_card_for_model(model1).model).toBe(model1);
            expect(arrangement.get_card_for_model(model2).model).toBe(model2);
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

        it('by not creating a card for a filtered-out model', function () {
            add_filtered_card(arrangement);
            expect(factory.get_created('card').length).toBe(0);
        });

        it('by not updating the card count for a filtered-out model', function () {
            add_cards(arrangement, 3);
            add_filtered_card(arrangement);

            expect(arrangement.get_card_count()).toBe(3);
        });

        it('by removing a model that has no card', function () {
            add_cards(arrangement, 3);
            let model = add_filtered_card(arrangement);
            arrangement.remove_model(model);

            expect(arrangement.get_models()).not.toContain(model);
        });

        it('by not returning a card for a model that has none', function () {
            let model = add_filtered_card(arrangement);

            expect(arrangement.get_card_for_model(model)).not.toBeDefined();
        });

        it('by not including filtered-out models in the filtered models list', function () {
            add_cards(arrangement, 3);
            let model = add_filtered_card(arrangement);
            let models = arrangement.get_models();

            expect(models.length).toBe(3);
            expect(models).not.toContain(model);
        });
    });
}

function test_arrangement_fade_in_compliance(ArrangementClass, extra_slots={}) {
    describe(ArrangementClass.$gtype.name + ' implements the optional fade-in part of Arrangement', function () {
        let factory, arrangement;

        beforeEach(function () {
            [arrangement, factory] = MockFactory.setup_tree({
                type: ArrangementClass,
                slots: _merge_slots_into(extra_slots, {
                    'card': { type: Minimal.MinimalCard },
                }),
            });
        });

        it('by fading in cards when requested to', function () {
            arrangement.fade_cards = true;
            let model = new ContentObjectModel.ContentObjectModel();
            arrangement.set_models([model]);
            expect(arrangement.get_card_for_model(model).fade_in)
                .toHaveBeenCalled();
        });

        it('by not fading in cards when requested not to', function () {
            arrangement.fade_cards = false;
            let model = new ContentObjectModel.ContentObjectModel();
            arrangement.set_models([model]);
            expect(arrangement.get_card_for_model(model).fade_in)
                .not.toHaveBeenCalled();
        });
    });
}

function test_card_container_fade_in_compliance(action, CardContainerClass, extra_slots={}) {
    describe(CardContainerClass.$gtype.name + ' implements the optional fade-in part of CardContainer', function () {
        let arrangement, dispatcher, model;

        beforeEach(function () {
            dispatcher = MockDispatcher.mock_default();
            let [, factory] = MockFactory.setup_tree({
                type: CardContainerClass,
                slots: _merge_slots_into(extra_slots, {
                    'arrangement': {
                        type: Minimal.MinimalArrangement,
                        slots: {
                            'card': { type: Minimal.MinimalCard },
                        },
                    },
                }),
            });
            arrangement = factory.get_last_created('arrangement');
            model = new ContentObjectModel.ContentObjectModel();
            dispatcher.dispatch({
                action_type: action,
                models: [model],
            });
            Utils.update_gui();
        });

        it('does not fade in the first batch of cards', function () {
            expect(arrangement.fade_cards).toBeFalsy();
        });

        it('does fade in subsequent batches', function () {
            model = new ContentObjectModel.ContentObjectModel();
            dispatcher.dispatch({
                action_type: action,
                models: [model],
            });
            Utils.update_gui();
            expect(arrangement.fade_cards).toBeTruthy();
        });
    });
}

function test_selection_compliance (SelectionClass, extra_slots={}) {
    describe(SelectionClass.$gtype.name + ' implements Selection correctly', function () {
        let factory, selection;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            [selection, factory] = MockFactory.setup_tree({
                type: SelectionClass,
                slots: _merge_slots_into(extra_slots, {
                    'order': { type: Minimal.MinimalOrder },
                    'filter': { type: Minimal.TitleFilter },
                }),
            });
        });

        function add_models (c, num) {
            let models = [];
            for (let ix = 0; ix < num; ix++) {
                let model = new ContentObjectModel.ContentObjectModel();
                models.push(model);
                c.add_model(model);
            }
            return models;
        }

        function add_filtered_models (c, num) {
            let models = [];
            for (let ix = 0; ix < num; ix++) {
                let model = new ContentObjectModel.ContentObjectModel({
                    title: '0Filter me out',
                });
                models.push(model);
                c.add_model(model);
            }
            return models;
        }

        it('by adding models to the map', function () {
            let models = add_models(selection, 3);

            expect(selection.get_models().length).toBe(3);
        });

        it('by not adding filtered out models to the map', function () {
            let models = add_models(selection, 3);
            let models = add_filtered_models(selection, 1);
            expect(selection.get_models().length).toBe(3);
        });

        it('by keeping models in desired order', function () {
            let models = [];
            for (let ix = 5; ix > 0; ix--) {
                let model = new ContentObjectModel.ContentObjectModel({
                    title: ix.toString(),
                });
                selection.add_model(model);
                models.push(model);
            }
            expect(selection.get_models().length).toBe(5);
            expect(selection.get_models()).toEqual(models.reverse());
        });

        it('by clearing models when requested', function () {
            let models = add_models(selection, 3);
            selection.clear();
            expect(selection.get_models().length).toBe(0);
        });

        it('by allowing client to connect to change signal', function () {
            expect(() => {
                selection.connect('models-changed', () => {});
            }).not.toThrow();
        });

        it('by not leaving queue_load_more unimplemented', function () {
            expect(() => {
                selection.queue_load_more();
            }).not.toThrow();
        });
    });
}
