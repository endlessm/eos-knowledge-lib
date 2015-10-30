// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const HalfArrangement = imports.app.modules.halfArrangement;
const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
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
                add_card(new MockWidgets.TestBox(2000));

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
