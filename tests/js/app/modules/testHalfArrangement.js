// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const HalfArrangement = imports.app.modules.halfArrangement;
const Minimal = imports.tests.minimal;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Half Arrangement', function () {
    beforeEach(function () {
        this.arrangement = new HalfArrangement.HalfArrangement();
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();

    describe('sizing allocation', function () {
        beforeEach(function () {
            let add_card = (card) => {
                card.show_all();
                this.arrangement.add_card(card);
                return card;
            };

            for (let i = 0; i < 5; i++)
                add_card(new Minimal.MinimalCard());

            this.win = new Gtk.OffscreenWindow();
            this.win.add(this.arrangement);
        });

        afterEach(function () {
            this.win.destroy();
        });

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
        beforeEach(function () {
            this.win = new Gtk.OffscreenWindow();
            this.win.add(this.arrangement);
            // In a 1000px wide arrangement, feature cards will be 500px wide
            // and regular cards will be 333px wide.
            this.win.set_size_request(1000, 500);
        });

        afterEach(function () {
            this.win.destroy();
        });

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

function testSizingArrangementForDimensions(arrangement_size, card_width, card_height) {
    it('handles arrangement with width=' + arrangement_size, function () {
        this.win.set_size_request(arrangement_size, arrangement_size);
        this.win.show_all();

        this.win.queue_resize();
        Utils.update_gui();

        let all_cards = this.arrangement.get_cards();
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
        for (let i = 0; i < total_cards; i++) {
            this.arrangement.add_card(new Minimal.MinimalCard());
        }
        this.win.show_all();
        this.win.queue_resize();
        Utils.update_gui();

        this.arrangement.get_cards().slice(0, featured_cards).forEach((card) => {
            expect(card.get_allocation().width).toBe(featured_size);
        });
        this.arrangement.get_cards().slice(featured_cards).forEach((card) => {
            expect(card.get_allocation().width).toBe(non_featured_size);
        });
    });
}
