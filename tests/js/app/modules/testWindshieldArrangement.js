// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const WindshieldArrangement = imports.app.modules.windshieldArrangement;

Gtk.init(null);

describe('Windshield Arrangement', function () {
    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        this.arrangement = new WindshieldArrangement.WindshieldArrangement({
            vexpand: false,
        });
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();

    describe('sizing allocation', function () {
        // At 2000x2000, the featured card should be 2000x400, and the children
        // cards should be 666x200.
        testSizingArrangementForDimensions(2000, 600, 666);

        // At 1200x1200, the featured card should be 1200x400, and the children
        // cards should be 400x200.
        testSizingArrangementForDimensions(1200, 1200, 400);

        // At 1000x1000, the featured card should be 1000x400, and the children
        // cards should be 333x200.
        testSizingArrangementForDimensions(1000, 1000, 333);

        // At 900x900, the featured card should be 900x400, and the children
        // cards should be 300x200.
        testSizingArrangementForDimensions(900, 900, 300);

        // At 800x600, the featured card should be 800x200, and the children
        // cards should be 266x200.
        testSizingArrangementForDimensions(800, 600, 266);

        // At 600x400, the featured card should be 600x200, and the children
        // cards should be 200x200.
        testSizingArrangementForDimensions(600, 400, 200);
    });

    describe('get_max_cards', function () {
        it ('is 4', function () {
            expect(this.arrangement.get_max_cards()).toBe(4);
        });
    });
});

function testSizingArrangementForDimensions(total_width, total_height, child_width) {
    let win, add_card, cards;

    beforeEach(function () {
        add_card = (card) => {
            card.show_all();
            this.arrangement.add(card);
            return card;
        };
        cards = [];

        for (let i = 0; i < 5; i++) {
            cards.push(add_card(new MockWidgets.TestBox(2000)));
        }
        win = new Gtk.OffscreenWindow();
    });

    afterEach(function () {
        win.destroy();
    });

    it ('handles arrangement with dimensions ' + total_width + 'x' + total_height, function () {
        win.add(this.arrangement);
        win.set_size_request(total_width, total_height);
        win.show_all();

        win.queue_resize();
        Utils.update_gui();

        this.arrangement.get_cards().forEach((card, i) => {
            if (i === 0) {
                // FIXME: For now we're treating the first card as the featured card.
                expect(card.get_child_visible()).toBe(true);
                expect(card.get_allocation().width).toBe(total_width);
            } else if (i < 4) {
                // Three supporting child cards should be visible
                expect(card.get_child_visible()).toBe(true);
                expect(card.get_allocation().width).toBe(child_width);
            } else {
                // Additional cards should not be visible
                expect(card.get_child_visible()).toBe(false);
            }
        });
    });
}
