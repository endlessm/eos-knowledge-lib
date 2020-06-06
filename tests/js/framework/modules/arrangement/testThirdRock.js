// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const ThirdRock = imports.framework.modules.arrangement.thirdRock;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(ThirdRock.ThirdRock);

describe('Arrangement.ThirdRock', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: ThirdRock.ThirdRock,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_cards(arrangement, 10);
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(compact_mode, arr_width, arr_height, child_width) {
            let message = 'handles arrangement for specified dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it(message, function () {
                arrangement.compact_mode = compact_mode;

                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                // all_visible is always true for this arrangement since max_cards is fixed
                // at 3, and any models in excess of that won't even be held on the arrangement.
                expect(arrangement.all_visible).toBe(true);
                expect(arrangement.get_allocation().height).toBe(arr_height);

                let all_cards = factory.get_created('card');

                all_cards.slice(0, 3).forEach((card) => {
                    expect(card.get_allocation().width).toBe(child_width);
                    expect(card.get_child_visible()).toBe(true);
                });

                all_cards.slice(3).forEach((card) => {
                    expect(card.get_child_visible()).toBe(false);
                });
            });
        }

        describe('on normal mode', function () {
            // On normal mode and width=1200, arrangement height=400, all cards of width=400
            testSizingArrangementForDimensions(false, 1200, 500, 400);
            // On normal mode and width=1000, arrangement height=400, all cards of width=333
            testSizingArrangementForDimensions(false, 1000, 500, 333);
            // On normal mode and width=900, arrangement height=400, all cards of width=300
            testSizingArrangementForDimensions(false, 900, 500, 300);
            // On normal mode and width=800, arrangement height=400, all cards of width=266
            testSizingArrangementForDimensions(false, 800, 500, 266);
            // On normal mode and width=600, arrangement height=300, all cards of width=200
            testSizingArrangementForDimensions(false, 600, 400, 200);
        });

        describe('on compact mode', function () {
            // On compact mode and width=1200, arrangement height=300, all cards of width=400
            testSizingArrangementForDimensions(true, 1200, 400, 400);
            // On compact mode and width=1000, arrangement height=300, all cards of width=333
            testSizingArrangementForDimensions(true, 1000, 400, 333);
            // On compact mode and width=900, arrangement height=300, all cards of width=300
            testSizingArrangementForDimensions(true, 900, 400, 300);
            // On compact mode and width=800, arrangement height=200, all cards of width=266
            testSizingArrangementForDimensions(true, 800, 400, 266);
            // On compact mode and width=600, arrangement height=200, all cards of width=200
            testSizingArrangementForDimensions(true, 600, 400, 200);
        });
    });
});
