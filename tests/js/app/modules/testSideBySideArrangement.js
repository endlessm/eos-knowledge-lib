// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SideBySideArrangement = imports.app.modules.sideBySideArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(SideBySideArrangement.SideBySideArrangement);

const CHILD_WIDTH = 100;

describe('SideBySide Arrangement', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard, {}, {
            width_request: CHILD_WIDTH,
        });
        factory.add_named_mock('order', Minimal.CardCreateOrder);
        factory.add_named_mock('arrangement', SideBySideArrangement.SideBySideArrangement, {
            'card-type': 'card',
            'order': 'order',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_ordered_cards(arrangement, 10);
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

                let cards = factory.get_created_named_mocks('card');
                cards.forEach((card, i) => {
                    if (i < visible_children) {
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().x).toBe(x);
                        x += (CHILD_WIDTH + spacing);
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
