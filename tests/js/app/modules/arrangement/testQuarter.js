// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Quarter = imports.app.modules.arrangement.quarter;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(Quarter.Quarter);
Compliance.test_arrangement_fade_in_compliance(Quarter.Quarter);

describe('Quarter Arrangement', function () {
    let arrangement, win, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('order', Minimal.MinimalOrder);
        factory.add_named_mock('filter', Minimal.TitleFilter);
        factory.add_named_mock('arrangement', Quarter.Quarter, {
            'card-type': 'card',
            'order': 'order',
            'filter': 'filter',
        });
        arrangement = factory.create_named_module('arrangement');

        Minimal.add_ordered_cards(arrangement, 10);
        Minimal.add_filtered_cards(arrangement, 1, 0);
        win = new Gtk.OffscreenWindow();
        win.add(arrangement);
        win.show_all();
    });

    afterEach(function () {
        win.destroy();
    });

    describe('sizing allocation', function () {
        function testSizingArrangementForDimensions(arrangement_size, featured_cards_per_row, support_cards_per_row) {
            it('handles arrangement with width=' + arrangement_size, function () {
                win.set_size_request(arrangement_size, arrangement_size);
                win.show_all();

                win.queue_resize();
                Utils.update_gui();

                let cards = factory.get_created_named_mocks('card');
                let featured_cards = cards.slice(0, featured_cards_per_row);
                let support_cards = cards.slice(featured_cards_per_row);

                let featured_card_width = Math.floor(arrangement_size / featured_cards_per_row);
                let support_card_width = Math.floor(arrangement_size / support_cards_per_row);
                // Test featured cards
                featured_cards.forEach(card => {
                    expect(card.get_allocation().width).toBe(featured_card_width);
                    expect(card.get_child_visible()).toBe(true);
                });

                // Test support cards
                support_cards.forEach(card => {
                    expect(card.get_allocation().width).toBe(support_card_width);
                    expect(card.get_child_visible()).toBe(true);
                });
            });
        }

        // At width=2000px, arrangement shows four featured cards and rows of three support cards
        testSizingArrangementForDimensions(2000, 4, 3);
        // At width=1200px, arrangement shows four featured cards and rows of three support cards
        testSizingArrangementForDimensions(1200, 4, 3);
        // At width=900px, arrangement shows three featured cards and rows of two support cards
        testSizingArrangementForDimensions(900, 3, 2);
        // At width=800px, arrangement shows two featured cards and rows of two support cards
        testSizingArrangementForDimensions(720, 2, 2);
        // At width=800px, arrangement shows two featured cards and rows of two support cards
        testSizingArrangementForDimensions(640, 2, 2);
    });
});
