// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;
const Windshield = imports.framework.modules.arrangement.windshield;

Gtk.init(null);

Compliance.test_arrangement_compliance(Windshield.Windshield);

describe('Arrangement.Windshield', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: Windshield.Windshield,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_cards(arrangement, 5);
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(total_width, total_height, child_width) {
            it('handles arrangement with dimensions ' + total_width + 'x' + total_height, function () {
                win.set_size_request(total_width, total_height);
                Utils.update_gui();

                let cards = factory.get_created('card');
                cards.forEach((card, i) => {
                    if (i === 0) {
                        // FIXME: For now we're treating the first card as the
                        // featured card.
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

    it('has maximum 4 cards', function () {
        expect(arrangement.get_max_cards()).toBe(4);
    });
});
