// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;
const WindshieldArrangement = imports.app.modules.windshieldArrangement;

Gtk.init(null);

Compliance.test_arrangement_compliance(WindshieldArrangement.WindshieldArrangement);

describe('Windshield Arrangement', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('order', Minimal.CardCreateOrder);
        factory.add_named_mock('filter', Minimal.TitleFilter);
        factory.add_named_mock('arrangement', WindshieldArrangement.WindshieldArrangement, {
            'card-type': 'card',
            'order': 'order',
            'filter': 'filter',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_ordered_cards(arrangement, 5);
            Minimal.add_filtered_cards(arrangement, 1, 0);
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

                let cards = factory.get_created_named_mocks('card');
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
