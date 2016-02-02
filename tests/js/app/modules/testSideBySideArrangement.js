// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const SideBySideArrangement = imports.app.modules.sideBySideArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Minimal.test_arrangement_compliance(SideBySideArrangement.SideBySideArrangement);

describe('SideBySide Arrangement', function () {
    let arrangement;

    beforeEach(function () {
        arrangement = new SideBySideArrangement.SideBySideArrangement();
    });

    describe('sizing allocation', function () {
        let win, arrangement_height, child_width;

        beforeEach(function () {
            // Constant sizes on the widgets
            arrangement_height = 100;
            child_width = 100;

            for (let i = 0; i < 10; i++) {
                let card = new Minimal.MinimalCard({
                    width_request: child_width,
                });
                arrangement.add_card(card);
            }
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, visible_children, spacing) {
            let message = 'handles arrangement for width=' + arr_width;
            let x = 0;

            it (message, function () {
                win.set_size_request(arr_width, 100);
                Utils.update_gui();

                arrangement.get_children().forEach((card, i) => {
                    if (i < visible_children) {
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().x).toBe(x);
                        x += (child_width + spacing);
                    } else {
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        // At width=2000px, all ten cards should be visible with 50px spacing
        testSizingArrangementForDimensions(2000, 10, 50);
        // At width=1200px, eight cards should be visible, with 40px spacing
        testSizingArrangementForDimensions(1200, 8, 40);
        // At width=1000px, seven cards should be visible, with 40px spacing
        testSizingArrangementForDimensions(1000, 7, 40);
        // At width=800px, seven cards should be visible, with 20px spacing
        testSizingArrangementForDimensions(900, 7, 20);
        // At width=800px, six cards should be visible, with 20px spacing
        testSizingArrangementForDimensions(800, 6, 20);
        // At width=720px, six cards should be visible, with 15px spacing
        testSizingArrangementForDimensions(720, 6, 15);
        // At width=600px, five cards should be visible, with 15x spacing
        testSizingArrangementForDimensions(600, 5, 15);
    });
});
