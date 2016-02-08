// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const ThirdRockArrangement = imports.app.modules.thirdRockArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Minimal.test_arrangement_compliance(ThirdRockArrangement.ThirdRockArrangement);

describe('ThirdRock arrangement', function () {
    let arrangement;

    beforeEach(function () {
        arrangement = new ThirdRockArrangement.ThirdRockArrangement();
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            for (let i = 0; i < 10; i++) {
                let card = new Minimal.MinimalCard();
                arrangement.add_card(card);
            }
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, arr_height, child_width) {
            let message = 'handles arrangement for specified dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it(message, function () {
                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                expect(arrangement.get_allocation().height).toBe(arr_height);

                let all_cards = arrangement.get_children();

                all_cards.slice(0, 3).forEach((card) => {
                    expect(card.get_allocation().width).toBe(child_width);
                    expect(card.get_child_visible()).toBe(true);
                });

                all_cards.slice(3).forEach((card) => {
                    expect(card.get_child_visible()).toBe(false);
                });
            });
        }

        // At 1200x400, all cards of width=400
        testSizingArrangementForDimensions(1200, 400, 400);
        // At 1000x400, all cards of width=333
        testSizingArrangementForDimensions(1000, 400, 333);
        // At 900x400, all cards of width=300
        testSizingArrangementForDimensions(900, 400, 300);
        // At 800x300, all cards of width=266
        testSizingArrangementForDimensions(800, 300, 266);
        // At 600x300, all cards of width=200
        testSizingArrangementForDimensions(600, 300, 200);
    });
});
