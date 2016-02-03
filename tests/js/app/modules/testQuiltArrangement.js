// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const QuiltArrangement = imports.app.modules.quiltArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Minimal.test_arrangement_compliance(QuiltArrangement.QuiltArrangement);

describe('Quilt arrangement', function () {
    let arrangement;

    beforeEach(function () {
        arrangement = new QuiltArrangement.QuiltArrangement();
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            for (let i = 0; i < 5; i++) {
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

        function testSizingArrangementForDimensions(arr_width, arr_height, visible_cards,
            primary_width, secondary_width, support_width) {
            let message = 'handles arrangement for specified dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it (message, function () {
                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                arrangement.get_children().forEach((card, i) => {
                    if (i < visible_cards) {
                        if (i === 0) {
                            expect(card.get_allocation().width).toBe(primary_width);
                        } else if (i === 1) {
                            expect(card.get_allocation().width).toBe(secondary_width);
                        } else {
                            expect(card.get_allocation().width).toBe(support_width);
                        }
                        expect(card.get_child_visible()).toBe(true);
                    } else {
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        // At 2000x400, four cards should be visible; primary width=1000, secondary width=500,
        // support width=500
        testSizingArrangementForDimensions(2000, 400, 4, 1000, 500, 500);
        // At 1200x400, four cards should be visible; primary width=600, secondary width=300,
        // support width=300
        testSizingArrangementForDimensions(1200, 400, 4, 600, 300, 300);
        // At 1000x400, two cards should be visible; primary width=666, secondary width=333
        testSizingArrangementForDimensions(1000, 400, 2, 666, 333, 0);
        // At 900x300, two cards should be visible; primary width=514, secondary width=385
        testSizingArrangementForDimensions(900, 300, 2, 514, 385, 0);
        // At 800x300, two cards should be visible; primary width=457, secondary width=342
        testSizingArrangementForDimensions(800, 300, 2, 457, 342, 0);
    });
});
