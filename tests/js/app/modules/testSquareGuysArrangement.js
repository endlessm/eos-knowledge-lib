// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
const SquareGuysArrangement = imports.app.modules.squareGuysArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('SquareGuys arrangement', function () {
    beforeEach(function () {
        this.arrangement = new SquareGuysArrangement.SquareGuysArrangement({
            hexpand: false,
            valign: Gtk.Align.START,
            spacing: 0,
        });
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();

    describe('sizing allocation', function () {
        // At 2000x2000, all eight cards should be visible and of size 399x300
        testSizingArrangementForDimensions(2000, 2000, 8, 399, 300);

        // At 1200x1200, all eight cards should be visible and of size 300x300
        testSizingArrangementForDimensions(1200, 1200, 8, 300, 300);

        // At 1000x1000, only first six cards should be visible; all cards of size 333x300
        testSizingArrangementForDimensions(1000, 1000, 6, 333, 300);

        // At 900x900, only first six cards should be visible; all cards of size 300x300
        testSizingArrangementForDimensions(900, 900, 6, 300, 300);

        // At 800x600, only first six cards should be visible; all cards of size 266x200
        testSizingArrangementForDimensions(800, 600, 6, 266, 200);

        // At 600x400, only first six cards should be visible; all cards of size 200x200
        testSizingArrangementForDimensions(600, 400, 6, 200, 200);
    });
});

function testSizingArrangementForDimensions(arr_width, arr_height, visible_children, child_width, child_height) {
    it ('handles arrangement with dimensions ' + arr_width + 'x' + arr_height, function () {
        let add_card = (card) => {
            card.show_all();
            this.arrangement.add(card);
            return card;
        };
        let cards = [];

        this.win = new Gtk.OffscreenWindow();
        this.win.add(this.arrangement);
        this.win.set_size_request(arr_width, arr_height);
        this.win.show_all();

        for (let i=0; i<8; i++) {
            cards.push(add_card(new MockWidgets.TestBox(400)));
        }

        this.win.queue_resize();
        Utils.update_gui();

        this.arrangement.get_children().forEach((card, i) => {
            if (i < visible_children) {
                expect(card.get_allocation().width).toBe(child_width);
                expect(card.get_allocation().height).toBe(child_height);
                expect(card.get_child_visible()).toBe(true);
            } else {
                expect(card.get_child_visible()).toBe(false);
            }
        });

        this.win.destroy();
    });
}
