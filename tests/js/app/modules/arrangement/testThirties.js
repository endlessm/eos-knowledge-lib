// Copyright 2016 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Thirties = imports.app.modules.arrangement.thirties;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(Thirties.Thirties);
// Compliance.test_arrangement_fade_in_compliance(Thirties.Thirties);

describe('Arrangement.Thirties', function () {
    it('does not fade in cards if it has a fixed size', function () {
        let [arrangement,] = MockFactory.setup_tree({
            type: Thirties.Thirties,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        }, {
            max_rows: 1,
            fade_cards: true,
        });
        let model = new DModel.Content();
        arrangement.set_models([model]);
        expect(arrangement.get_card_for_model(model).fade_in)
            .not.toHaveBeenCalled();
    });

    describe('sizing allocation', function () {
        let win, arrangement, factory;

        beforeEach(function () {
            [arrangement, factory] = MockFactory.setup_tree({
                type: Thirties.Thirties,
                slots: {
                    'card': { type: Minimal.MinimalCard },
                },
            });

            Minimal.add_cards(arrangement, 12);
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, arr_height, max_rows, visible_children, child_width, all_visible) {
            let message = 'handles arrangement for specified max_rows (' + max_rows +
                ') and dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it (message, function () {
                arrangement.max_rows = max_rows;

                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                expect(arrangement.all_visible).toBe(all_visible);

                let cards = factory.get_created('card');
                cards.forEach((card, i) => {
                    if (i < visible_children) {
                        expect(card.get_allocation().width).toBe(child_width);
                        expect(card.get_child_visible()).toBe(true);
                    } else {
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        // At 2000x2000, max_rows=2, six cards should be visible and of width 400
        testSizingArrangementForDimensions(2000, 2000, 2, 6, 666, false);
        // At 1200x1200, and 1 max_rows, six cards should be visible and of width 400
        testSizingArrangementForDimensions(1200, 1200, 2, 6, 400, false);
        // At 1000x1000, max_rows=2, six cards should be visible; all cards of width 333
        testSizingArrangementForDimensions(1000, 1000, 2, 6, 333, false);
        // At 900x900, max_rows=2, six cards should be visible; all cards of width 300
        testSizingArrangementForDimensions(900, 900, 2, 6, 300, false);
        // At 800x600, max_rows=2, six cards should be visible; all cards of width 266
        testSizingArrangementForDimensions(800, 600, 2, 6, 266, false);
        // At 600x400, max_rows=2, six cards should be visible; all cards of width 200
        testSizingArrangementForDimensions(600, 400, 2, 6, 200, false);

        // With max_rows=1, three cards should be visible and of width 400
        testSizingArrangementForDimensions(1200, 1200, 1, 3, 400, false);
        // With max_rows=3, nine cards should be visible and of width 400
        testSizingArrangementForDimensions(1200, 1200, 3, 9, 400, false);
        // With max_rows=4, 12 cards should be visible and of width 400
        testSizingArrangementForDimensions(1200, 1200, 4, 12, 400, true);
        // With max_rows=0, all 12 cards should be visible; all cards of width 400
        testSizingArrangementForDimensions(1200, 1200, 0, 12, 400, true);
    });
});

