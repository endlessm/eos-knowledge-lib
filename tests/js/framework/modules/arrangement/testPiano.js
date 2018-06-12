// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Piano = imports.framework.modules.arrangement.piano;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(Piano.Piano);

describe('Arrangement.Piano', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: Piano.Piano,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_cards(arrangement, 4);
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(compact_mode, all_visible, total_width, total_height, support_cards_shown, child_width) {
            it ('handles arrangement with dimensions ' + total_width + 'x' + total_height, function () {
                arrangement.compact_mode = compact_mode;
                win.set_size_request(total_width, total_width);
                Utils.update_gui();

                expect(arrangement.all_visible).toBe(all_visible);

                let cards = factory.get_created('card');
                cards.forEach((card, i) => {
                    if (i === 0) {
                        // FIXME: For now we're treating the first card as the featured card.
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().height).toBe(total_height);
                        expect(card.get_allocation().width).toBe(Math.floor(total_width * 2 / 3));
                    } else if (i < (support_cards_shown + 1)) {
                        // Only the specified number of supporting cards should be visible
                        expect(card.get_child_visible()).toBe(true);
                        expect(card.get_allocation().height).toBe(Math.floor(total_height / support_cards_shown));
                        expect(card.get_allocation().width).toBe(child_width);
                    } else {
                        // Additional cards should not be visible
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        describe('in normal mode', function () {
            // At 2000x600, the featured card should be 1333x600,
            // and three children cards should be 666x200.
            // All cards are visible.
            testSizingArrangementForDimensions(false, true, 2000, 600, 3, 666);
            // At 1200x600, the featured card should be 800x600,
            // and three children cards should be 400x200.
            // All cards are visible.
            testSizingArrangementForDimensions(false, true, 1200, 600, 3, 400);
            // At 1000x600, the featured card should be 666x600,
            // and three children cards should be 333x200.
            // All cards are visible.
            testSizingArrangementForDimensions(false, true, 1000, 600, 3, 333);
            // At 900x600, the featured card should be 600x600,
            // and three children cards should be 300x200.
            // All cards are visible.
            testSizingArrangementForDimensions(false, true, 900, 600, 3, 300);
            // At 800x400, the featured card should be 533x400,
            // and two children cards should be 266x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(false, false, 800, 400, 2, 266);
            // At 720x400, the featured card should be 480x400,
            // and two children cards should be 240x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(false, false, 720, 400, 2, 240);
        });

        describe('in compact mode', function () {
            // At 2000x400, the featured card should be 1333x400,
            // and two children cards should be 666x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 2000, 400, 2, 666);
            // At 1200x400, the featured card should be 800x400,
            // and two children cards should be 400x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 1200, 400, 2, 400);
            // At 1000x400, the featured card should be 666x400,
            // and two children cards should be 333x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 1000, 400, 2, 333);
            // At 900x400, the featured card should be 600x400,
            // and two children cards should be 300x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 900, 400, 2, 300);
            // At 800x400, the featured card should be 533x400
            // , and two children cards should be 266x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 800, 400, 2, 266);
            // At 720x400, the featured card should be 480x400,
            // and two children cards should be 240x200.
            // Not all cards are visible.
            testSizingArrangementForDimensions(true, false, 720, 400, 2, 240);
        });
    });
});
