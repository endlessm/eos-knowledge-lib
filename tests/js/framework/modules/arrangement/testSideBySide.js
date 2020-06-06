// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SideBySide = imports.framework.modules.arrangement.sideBySide;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(SideBySide.SideBySide);

const CHILD_WIDTH = 100;

describe('Arrangement.SideBySide', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: SideBySide.SideBySide,
            slots: {
                'card': {
                    type: Minimal.MinimalCard,
                    properties: {
                        'width-request': CHILD_WIDTH,
                    },
                },
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
            // For some reason, this line causes a seg fault
            // win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, visible_children, all_visible) {
            let message = 'handles arrangement for width=' + arr_width;
            let x = arr_width - (visible_children * CHILD_WIDTH);

            it (message, function () {
                win.set_size_request(arr_width, 100);
                Utils.update_gui();

                if (!all_visible)
                    x -= arrangement._button_nat;

                expect(arrangement.all_visible).toBe(all_visible);

                let cards = factory.get_created('card');
                let dropdown_cards = arrangement._popover_box.get_children();
                cards.forEach((card, i) => {
                    expect(card.get_visible()).toBe(true);
                    if (i < visible_children) {
                        expect(card.get_parent()).toBe(arrangement);
                        expect(card.get_allocation().x).toBe(x);
                        x += CHILD_WIDTH;
                    } else {
                        expect(card.get_parent()).toBe(arrangement._popover_box);
                        expect(dropdown_cards.indexOf(card)).toBe(i-visible_children);
                    }
                });
            });
        }

        // At width=2000px, all ten cards should be visible
        testSizingArrangementForDimensions(2000, 10, true);
        // At width=1000px, all ten cards should be visible
        testSizingArrangementForDimensions(1000, 10, true);
        // At width=950px, 9 cards should be visible
        testSizingArrangementForDimensions(950, 9, false);
        // At width=850px, 8 cards should be visible
        testSizingArrangementForDimensions(850, 8, false);
        // At width=750px, 7 cards should be visible
        testSizingArrangementForDimensions(750, 7, false);
        // At width=250px, 2 cards should be visible
        testSizingArrangementForDimensions(250, 2, false);
        // At width=150px, 1 cards should be visible
        testSizingArrangementForDimensions(150, 1, false);
    });
});
