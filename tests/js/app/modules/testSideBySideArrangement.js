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
        factory.add_named_mock('order', Minimal.MinimalOrder);
        factory.add_named_mock('filter', Minimal.TitleFilter);
        factory.add_named_mock('arrangement', SideBySideArrangement.SideBySideArrangement, {
            'card-type': 'card',
            'order': 'order',
            'filter': 'filter',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_ordered_cards(arrangement, 10);
            Minimal.add_filtered_cards(arrangement, 1, 0);
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
        // At width=1400px, all ten cards should be visible, with 40px spacing
        testSizingArrangementForDimensions(1400, 10, 40);
        // At width=1200px, all ten cards should be visible, with 20px spacing
        testSizingArrangementForDimensions(1200, 10, 20);
        // At width=1150px, all ten cards should be visible, with 15px spacing
        testSizingArrangementForDimensions(1150, 10, 15);
        // At width=1000px, all ten cards should be visible, with 0px spacing
        testSizingArrangementForDimensions(1000, 10, 0);
        // At width=900px, nine cards should be visible, with 0px spacing
        testSizingArrangementForDimensions(900, 9, 0);
        // At width=800px, eight cards should be visible, with 0px spacing
        testSizingArrangementForDimensions(800, 8, 0);
        // At width=720px, seven cards should be visible, with 0px spacing
        testSizingArrangementForDimensions(720, 7, 0);
        // At width=600px, six cards should be visible, with 0x spacing
        testSizingArrangementForDimensions(600, 6, 0);
    });
});
