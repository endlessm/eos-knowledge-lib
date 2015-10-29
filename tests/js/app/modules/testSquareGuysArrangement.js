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
        this.arrangement = new SquareGuysArrangement.SquareGuysArrangement();
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();

    describe('maximum rows', function () {
        let msg = 'shows correct number of cards for max_rows = '
        // At 2000x2000, and unlimited max_rows, all 20 cards should be visible
        testSizingArrangementForDimensions(msg + 0, 2000, 2000, 0, 20, 399, 300);

        // At 2000x2000, and 1 max_row, only four cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg + 1, 2000, 2000, 1, 4, 399, 300);

        // At 2000x2000, and 2 max_rows, only eight cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg + 2, 2000, 2000, 2, 8, 399, 300);
    });

    describe('sizing allocation', function () {
        let msg = 'handles arrangement for specified dimensions';
        // At 2000x2000, and 2 max_rows, all eight cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg, 2000, 2000, 2, 8, 399, 300);

        // At 1200x1200, and 2 max_rows, all eight cards should be visible and of size 300x300
        testSizingArrangementForDimensions(msg, 1200, 1200, 2, 8, 300, 300);

        // At 1000x1000, and 2 max_rows, only first six cards should be visible; all cards of size 333x300
        testSizingArrangementForDimensions(msg, 1000, 1000, 2, 6, 333, 300);

        // At 900x900, and 2 max_rows, only first six cards should be visible; all cards of size 300x300
        testSizingArrangementForDimensions(msg, 900, 900, 2, 6, 300, 300);

        // At 800x600, and 2 max_rows, only first six cards should be visible; all cards of size 266x200
        testSizingArrangementForDimensions(msg, 800, 600, 2, 6, 266, 200);

        // At 600x400, and 2 max_rows, only first six cards should be visible; all cards of size 200x200
        testSizingArrangementForDimensions(msg, 600, 400, 2, 6, 200, 200);
    });
});

function testSizingArrangementForDimensions(message, arr_width, arr_height, max_rows, visible_children, child_width, child_height) {
    let arrangement, cards, add_card, win;

    beforeEach(function () {
        arrangement = new SquareGuysArrangement.SquareGuysArrangement({
            hexpand: false,
            valign: Gtk.Align.START,
            spacing: 0,
            max_rows: max_rows,
        });
        add_card = (card) => {
            card.show_all();
            arrangement.add(card);
            return card;
        };
        cards = [];
        win = new Gtk.OffscreenWindow();
    });

    afterEach(function () {
        win.destroy();
    });

    it (message + ' (' + arr_width + 'x' + arr_height + ')', function () {
        win.add(arrangement);
        win.set_size_request(arr_width, arr_height);
        win.show_all();

        for (let i=0; i<8; i++) {
            cards.push(add_card(new MockWidgets.TestBox(400)));
        }

        win.queue_resize();
        Utils.update_gui();

        arrangement.get_children().forEach((card, i) => {
            if (i < visible_children) {
                expect(card.get_allocation().width).toBe(child_width);
                expect(card.get_allocation().height).toBe(child_height);
                expect(card.get_child_visible()).toBe(true);
            } else {
                expect(card.get_child_visible()).toBe(false);
            }
        });
    });
}
