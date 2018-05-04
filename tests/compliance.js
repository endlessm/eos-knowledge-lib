// Copyright 2016 Endless Mobile, Inc.

/* exported test_arrangement_compliance, test_arrangement_fade_in_compliance,
test_card_compliance, test_card_container_fade_in_compliance */

const {DModel, Gtk} = imports.gi;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HistoryStore = imports.app.historyStore;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

function test_card_compliance(CardClass, setup=function () {}) {
    describe(CardClass.$gtype.name + ' implements Card correctly', function () {
        beforeEach(function () {
            jasmine.addMatchers(CssClassMatcher.customMatchers);
        });

        it('by having a theming class for PDF records', function () {
            let card = new CardClass({
                model: new DModel.Content({
                    title: 'The Joy Of Cooking, Pirated Copy',
                    content_type: 'application/pdf',
                }),
            });
            let pretty_name = CardClass.$gtype.name.slice('Ekn'.length)
                .replace(/_/, '', 'g');
            expect(card).toHaveCssClass('Card--pdf');
            expect(card).toHaveCssClass(pretty_name + '--pdf');
            card = new CardClass({
                model: new DModel.Content({
                    title: 'Autoconf Manual',
                    content_type: 'text/html',
                }),
            });
            setup(card);
            expect(card).not.toHaveCssClass('Card--pdf');
            expect(card).not.toHaveCssClass(pretty_name + '--pdf');
        });
    });

    describe(CardClass.$gtype.name + ' implements the highlighting part of Card', function () {
        let model, card, synopsis_label;

        beforeEach(function () {
            model = new DModel.Content({
                title: '!!! containing hippo',
                synopsis: '@@@ synopsis also containing hippo',
            });
            card = new CardClass({
                model: model,
                highlight_string: 'hippo',
            });
            setup(card);
            synopsis_label = Gtk.test_find_label(card, '*@@@*');
        });

        // Sadly, only works on ASCII text because Pango.Attribute indices are
        // bytes, not characters
        function get_spans(label) {
            let layout = label.get_layout();
            let attr_list = layout.get_attributes();
            let text = layout.get_text();
            let spans = [];
            attr_list.filter(attr => {
                spans.push(text.slice(attr.start_index, attr.end_index));
                return false;
            });
            return spans;
            // May return more than one element with the same text, because
            // multiple attributes may be applied to the same span of text
        }

        it('by highlighting a search string when constructed', function () {
            expect(get_spans(Gtk.test_find_label(card, '*!!!*'))
                .every(elem => elem === 'hippo')).toBeTruthy();
            if (synopsis_label)
                expect(get_spans(synopsis_label)
                    .every(elem => elem === 'hippo')).toBeTruthy();
        });

        it('by de-highlighting a search string', function () {
            card.highlight_string = '';
            expect(get_spans(Gtk.test_find_label(card, '*!!!*'))).toEqual([]);
            if (synopsis_label)
                expect(get_spans(synopsis_label)).toEqual([]);
        });

        it('by highlighting a search string', function () {
            card = new CardClass({ model: model });
            setup(card);
            card.highlight_string = 'hippo';
            expect(get_spans(Gtk.test_find_label(card, '*!!!*'))
                .every(elem => elem === 'hippo')).toBeTruthy();
            if (synopsis_label)
                expect(get_spans(synopsis_label)
                    .every(elem => elem === 'hippo')).toBeTruthy();
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
                }),
            });
        });

        function add_cards(a, ncards) {
            let models = [];
            for (let ix = 0; ix < ncards; ix++) {
                let model = new DModel.Content();
                models.push(model);
            }
            a.set_models(a.get_models().concat(models));
            Utils.update_gui();
            let created_cards = factory.get_created('card');
            let cards = models.map(model => created_cards.filter(card => card.model === model)[0]);
            return cards.slice(cards.length - ncards);
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

        it('by retrieving the contained models', function () {
            let cards = add_cards(arrangement, 3);

            cards.forEach(card =>
                expect(arrangement.get_models()).toContain(card.model));
        });

        it('by returning the card corresponding to a model', function () {
            let model1 = new DModel.Content();
            let model2 = new DModel.Content();
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
            let model = new DModel.Content();
            arrangement.set_models([model]);
            expect(arrangement.get_card_for_model(model).fade_in)
                .toHaveBeenCalled();
        });

        it('by not fading in cards when requested not to', function () {
            arrangement.fade_cards = false;
            let model = new DModel.Content();
            arrangement.set_models([model]);
            expect(arrangement.get_card_for_model(model).fade_in)
                .not.toHaveBeenCalled();
        });
    });
}

function test_selection_compliance (SelectionClass, setup=function () {}, extra_slots={}) {
    describe(SelectionClass.$gtype.name + ' implements Selection correctly', function () {
        let factory, selection, reading_history;

        beforeEach(function () {
            // History store default setting must happen before
            // we initialize the selection since during init it
            // will connect to history store's changed signal.
            let store = new HistoryStore.HistoryStore();
            HistoryStore.set_default(store);
            [selection, factory] = MockFactory.setup_tree({
                type: SelectionClass,
                slots: _merge_slots_into(extra_slots, {
                    'order': { type: Minimal.MinimalOrder },
                    'filter': { type: Minimal.TitleFilter },
                }),
            }, {
                model: new DModel.Set(),
            });

            // setup must happen after selection has been created so that
            // selection can listen to any history store changes that
            // occur during setup()
            setup(store);
            reading_history = MockReadingHistoryModel.mock_default();
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            // Not all Selections might use the Xapian engine, but I can't think
            // of a better place to put this
            let engine = MockEngine.mock_default();
            engine.query_promise.and.returnValue(Promise.resolve({ models: [] }));
        });

        function add_models (c, num) {
            let models = [];
            for (let ix = 0; ix < num; ix++) {
                let model = new DModel.Content();
                models.push(model);
                c.add_model(model);
            }
            return models;
        }

        function add_filtered_models (c, num) {
            let models = [];
            for (let ix = 0; ix < num; ix++) {
                let model = new DModel.Content({
                    title: '0Filter me out',
                });
                models.push(model);
                c.add_model(model);
            }
            return models;
        }

        it('by adding models to the map', function () {
            add_models(selection, 3);
            expect(selection.get_models().length).toBe(3);
        });

        it('by not adding filtered out models to the map', function () {
            add_models(selection, 3);
            add_filtered_models(selection, 1);
            expect(selection.get_models().length).toBe(3);
        });

        it('by keeping models in desired order', function () {
            let models = [];
            for (let ix = 5; ix > 0; ix--) {
                let model = new DModel.Content({
                    title: ix.toString(),
                });
                selection.add_model(model);
                models.push(model);
            }
            expect(selection.get_models().length).toBe(5);
            expect(selection.get_models()).toEqual(models.reverse());
        });

        it('by clearing models when requested', function () {
            add_models(selection, 3);
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
                selection.queue_load_more(10);
            }).not.toThrow();
        });

        it('by emitting models-changed directly when no animation is taking place', function (done) {
            HistoryStore.get_default().animating = false;
            selection.connect('models-changed', function () {
                done();
            });
            selection.emit_models_when_not_animating();
        });

        it('by emitting models-changed only after animation has stopped', function () {
            let spy = jasmine.createSpy();
            selection.connect('models-changed', spy);

            HistoryStore.get_default().animating = true;
            selection.emit_models_when_not_animating();
            expect(spy).not.toHaveBeenCalled();
            Utils.update_gui();

            HistoryStore.get_default().animating = false;
            HistoryStore.get_default().notify('animating');
            Utils.update_gui();
            expect(spy).toHaveBeenCalled();
        });
    });
}

function test_xapian_selection_compliance(SelectionClass, setup=function () {}, slots={}) {
    describe(SelectionClass.$gtype.name + ' implements Selection.Xapian correctly', function () {
        let factory, selection, reading_history, engine;

        beforeEach(function () {
            // History store default setting must happen before
            // we initialize the selection since during init it
            // will connect to history store's changed signal.
            let store = new HistoryStore.HistoryStore();
            HistoryStore.set_default(store);
            [selection, factory] = MockFactory.setup_tree({
                type: SelectionClass,
                slots: slots,
            }, {
                model: new DModel.Set(),
            });
            setup(store);
            reading_history = MockReadingHistoryModel.mock_default();
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            engine = MockEngine.mock_default();
            engine.query_promise.and.returnValue(Promise.resolve({ models: [] }));
        });

        it('continues the query based on how many results were added', function () {
            spyOn(selection, 'add_model').and.callThrough();
            let models = [];
            for (let ix = 0; ix < 10; ix++) {
                let model = new DModel.Content();
                models.push(model);
            }
            engine.query_promise.and.returnValue(Promise.resolve({ models: models, upper_bound: 10 }));
            selection.queue_load_more(3);
            Utils.update_gui();
            let first_query = engine.query_promise.calls.mostRecent().args[0];
            // Since we requested 3, we should only add three models to the
            // selection, regardless of how many actually came back.
            expect(selection.add_model.calls.count()).toBe(3);
            selection.queue_load_more(10);
            // When we request more models, we should start the offset from
            // where we left off
            let second_query = engine.query_promise.calls.mostRecent().args[0];
            expect(second_query.offset).toEqual(first_query.offset + 3);
        });

        it('by going into an error state when the engine throws an exception', function () {
            spyOn(window, 'logError');  // silence console message
            expect(selection.in_error_state).toBeFalsy();
            engine.query_promise.and.returnValue(Promise.reject(new Error('asplode')));
            selection.queue_load_more(1);
            Utils.update_gui();
            expect(selection.in_error_state).toBeTruthy();
        });

        it('saves the exception that was thrown', function () {
            spyOn(window, 'logError');  // silence console message
            engine.query_promise.and.returnValue(Promise.reject(new Error('asplode')));
            selection.queue_load_more(1);
            Utils.update_gui();
            expect(selection.get_error().message).toEqual('asplode');
        });
    });
}
