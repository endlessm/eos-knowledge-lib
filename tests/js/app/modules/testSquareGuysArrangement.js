// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SquareGuysArrangement = imports.app.modules.squareGuysArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(SquareGuysArrangement.SquareGuysArrangement);

describe('SquareGuys arrangement', function () {
    let factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('arrangement', SquareGuysArrangement.SquareGuysArrangement, {
            'card-type': 'card',
        });
    });

    describe('maximum rows', function () {
        let msg = 'shows correct number of cards for max_rows = '
        // At 2000x2000, and unlimited max_rows, all 20 cards should be visible
        testSizingArrangementForDimensions(msg + 0, 2000, 2000, 0, 20, 399, 300);

        // At 2000x2000, and 1 max_row, only four cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg + 1, 2000, 2000, 1, 4, 399, 300);

        // At 2000x2000, and 2 max_rows, only eight cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg + 2, 2000, 2000, 2, 8, 399, 300);
    });

    describe('sizing allocation', function () {
        let msg = 'handles arrangement for specified dimensions';
        // At 2000x2000, and 2 max_rows, all eight cards should be visible and of size 399x300
        testSizingArrangementForDimensions(msg, 2000, 2000, 2, 8, 399, 300);

        // At 1200x1200, and 2 max_rows, all eight cards should be visible and of size 300x300
        testSizingArrangementForDimensions(msg, 1200, 1200, 2, 8, 300, 300);

        // At 1000x1000, and 2 max_rows, only first six cards should be visible; all cards of size 333x300
        testSizingArrangementForDimensions(msg, 1000, 1000, 2, 6, 333, 300);

        // At 900x900, and 2 max_rows, only first six cards should be visible; all cards of size 300x300
        testSizingArrangementForDimensions(msg, 900, 900, 2, 6, 300, 300);

        // At 800x600, and 2 max_rows, only first six cards should be visible; all cards of size 266x200
        testSizingArrangementForDimensions(msg, 800, 600, 2, 6, 266, 200);

        // At 600x400, and 2 max_rows, only first six cards should be visible; all cards of size 200x200
        testSizingArrangementForDimensions(msg, 600, 400, 2, 6, 200, 200);
    });

    describe('get_max_cards', function () {
        it ('is 4 for one row', function () {
            let arrangement = factory.create_named_module('arrangement', {
                max_rows: 1,
            });
            expect(arrangement.get_max_cards()).toBe(4);
        });

        it ('is 8 for two rows', function () {
            let arrangement = factory.create_named_module('arrangement', {
                max_rows: 2,
            });
            expect(arrangement.get_max_cards()).toBe(8);
        });

        it ('is -1 if max rows unset', function () {
            let arrangement = factory.create_named_module('arrangement');
            expect(arrangement.get_max_cards()).toBe(-1);
        });
    });
});

function testSizingArrangementForDimensions(message, arr_width, arr_height, max_rows, visible_children, child_width, child_height) {
    it(message + ' (' + arr_width + 'x' + arr_height + ')', function () {
        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('arrangement', SquareGuysArrangement.SquareGuysArrangement, {
            'card-type': 'card',
        }, {
            hexpand: false,
            valign: Gtk.Align.START,
            spacing: 0,
            max_rows: max_rows,
        });
        let arrangement = factory.create_named_module('arrangement');
        let win = new Gtk.OffscreenWindow();

        win.add(arrangement);
        win.set_size_request(arr_width, arr_height);
        win.show_all();

        for (let i=0; i<8; i++) {
            let model = new ContentObjectModel.ContentObjectModel();
            arrangement.add_model(model);
            arrangement.get_card_for_model(model).show_all();
        }

        win.queue_resize();
        Utils.update_gui();

        arrangement.get_children().forEach((card, i) => {
            if (i < visible_children) {
                expect(card.get_allocation().width).toBe(child_width);
                expect(card.get_allocation().height).toBe(child_height);
                expect(card.get_child_visible()).toBe(true);
            } else {
                expect(card.get_child_visible()).toBe(false);
            }
        });

        win.destroy();
    });
}
