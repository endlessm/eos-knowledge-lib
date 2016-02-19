// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Compliance = imports.tests.compliance;
const HalfArrangement = imports.app.modules.halfArrangement;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(HalfArrangement.HalfArrangement);
Compliance.test_arrangement_fade_in_compliance(HalfArrangement.HalfArrangement);

describe('Half Arrangement', function () {
    let factory, arrangement, win;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('order', Minimal.MinimalOrder);
        factory.add_named_mock('filter', Minimal.TitleFilter);
        factory.add_named_mock('arrangement', HalfArrangement.HalfArrangement, {
            'card-type': 'card',
            'order': 'order',
            'filter': 'filter',
        });
        arrangement = factory.create_named_module('arrangement');

        win = new Gtk.OffscreenWindow();
        win.add(arrangement);
    });

    afterEach(function () {
        win.destroy();
    });

    function testSizingArrangementForDimensions(arrangement_size, card_width, card_height) {
        it('handles arrangement with width=' + arrangement_size, function () {
            Minimal.add_ordered_cards(arrangement, 5);
            Minimal.add_filtered_cards(arrangement, 1, 0);
            win.set_size_request(arrangement_size, arrangement_size);
            win.show_all();

            win.queue_resize();
            Utils.update_gui();

            let all_cards = factory.get_created_named_mocks('card');
            // Test featured cards
            all_cards.slice(0, 2).forEach((card) => {
                expect(card.get_child_visible()).toBe(true);
                expect(card.get_allocation().width).toBe(arrangement_size / 2);
                expect(card.get_allocation().height).toBe(Card.MinSize.C);
            });

            // Test support cards
            all_cards.slice(2, all_cards.length).forEach((card) => {
                expect(card.get_child_visible()).toBe(true);
                expect(card.get_allocation().width).toBe(card_width);
                expect(card.get_allocation().height).toBe(card_height);
            });
        });
    }

    function testFeaturedCardsInArrangement(total_cards, featured_cards, featured_size, non_featured_size) {
        it('treats ' + featured_cards + ' cards as featured when ' + total_cards + ' cards are added', function () {
            Minimal.add_ordered_cards(arrangement, total_cards);

            // In a 1000px wide arrangement, feature cards will be 500px wide
            // and regular cards will be 333px wide.
            win.set_size_request(1000, 500);
            win.show_all();
            win.queue_resize();
            Utils.update_gui();

            let cards = factory.get_created_named_mocks('card');
            cards.slice(0, featured_cards).forEach((card) => {
                expect(card.get_allocation().width).toBe(featured_size);
            });
            cards.slice(featured_cards).forEach((card) => {
                expect(card.get_allocation().width).toBe(non_featured_size);
            });
        });
    }

    describe('sizing allocation', function () {
        // At width=2000, featured cards should be 1000x300,
        // and the children cards should be 500x399.
        testSizingArrangementForDimensions(2000, 500, Card.MaxSize.C);

        // At width=1200, featured cards should be 600x300,
        // and the children cards should be 300x399.
        testSizingArrangementForDimensions(1200, 300, Card.MaxSize.C);

        // At width=1000, featured cards should be 500x300,
        // and the children cards should be 333x399.
        testSizingArrangementForDimensions(1000, 333, Card.MaxSize.C);

        // At width=900, featured cards should be 450x300,
        // and the children cards should be 300x399.
        testSizingArrangementForDimensions(900, 300, Card.MaxSize.C);

        // At width=800, featured cards should be 400x300,
        // and the children cards should be 266x300.
        testSizingArrangementForDimensions(800, 266, Card.MinSize.C);

        // At width=600, featured cards should be 300x300,
        // and the children cards should be 200x300.
        testSizingArrangementForDimensions(600, 200, Card.MinSize.C);
    });

    describe('shows right number of featured cards', function () {
        // With 1 packed cards, 1 should be featured.
        testFeaturedCardsInArrangement(1, 1, 500, 0);
        // With 2 packed cards, 2 should be featured.
        testFeaturedCardsInArrangement(2, 2, 500, 0);
        // With 3 packed cards, 3 should be featured.
        testFeaturedCardsInArrangement(3, 3, 500, 0);
        // With 4 packed cards, 4 should be featured.
        testFeaturedCardsInArrangement(4, 4, 500, 0);
        // With 5 packed cards, 2 should be featured.
        testFeaturedCardsInArrangement(5, 2, 500, 333);
        // With 10 packed cards, 2 should be featured.
        testFeaturedCardsInArrangement(10, 2, 500, 333);
    });
});
