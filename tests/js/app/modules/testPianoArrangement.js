// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
const PianoArrangement = imports.app.modules.pianoArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Minimal.test_arrangement_compliance(PianoArrangement.PianoArrangement);

describe('Piano Arrangement', function () {
    let arrangement;

    beforeEach(function () {
        arrangement = new PianoArrangement.PianoArrangement();
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            for (let i = 0; i < 5; i++) {
                let card = new Minimal.MinimalCard();
                arrangement.add(card);
            }
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(total_width, total_height, support_cards_shown, child_width) {
            it ('handles arrangement with dimensions ' + total_width + 'x' + total_height, function () {
                win.set_size_request(total_width, total_width);
                Utils.update_gui();

                arrangement.get_cards().forEach((card, i) => {
                    if (i === 0) {
                        // FIXME: For now we're treating the first card as the featured card.
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().height).toBe(total_height);
                        expect(card.get_allocation().width).toBe(Math.floor(total_width * 2 / 3));
                    } else if (i < (support_cards_shown + 1)) {
                        // Only the specified number of supporting cards should be visible
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().height).toBe(Math.floor(total_height / support_cards_shown));
                        expect(card.get_allocation().width).toBe(child_width);
                    } else {
                        // Additional cards should not be visible
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        // At 2000x600, the featured card should be 1333x600,
        // and three children cards should be 666x200.
        testSizingArrangementForDimensions(2000, 600, 3, 666);
        // At 1200x600, the featured card should be 1200x400,
        // and three children cards should be 400x200.
        testSizingArrangementForDimensions(1200, 600, 3, 400);
        // At 1000x600, the featured card should be 1000x400,
        // and three children cards should be 333x200.
        testSizingArrangementForDimensions(1000, 600, 3, 333);
        // At 900x600, the featured card should be 900x400,
        // and three children cards should be 300x200.
        testSizingArrangementForDimensions(900, 600, 3, 300);
        // At 800x400, the featured card should be 800x200
        // , and two children cards should be 266x200.
        testSizingArrangementForDimensions(800, 400, 2, 266);
        // At 720x400, the featured card should be 720x200,
        // and two children cards should be 240x200.
        testSizingArrangementForDimensions(720, 400, 2, 240);
    });
});
