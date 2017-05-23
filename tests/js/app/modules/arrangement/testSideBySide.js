// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SideBySide = imports.app.modules.arrangement.sideBySide;
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
            win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, visible_children, spacing, all_visible) {
            let message = 'handles arrangement for width=' + arr_width;
            let x = arr_width - (visible_children * (CHILD_WIDTH + spacing) - spacing);

            it (message, function () {
                win.set_size_request(arr_width, 100);
                Utils.update_gui();

                expect(arrangement.all_visible).toBe(all_visible);

                let cards = factory.get_created('card');
                cards.forEach((card, i) => {
                    if (i < visible_children) {
                        expect(card.is_visible()).toBe(true);

                        // TODO: find an easy way to test responsive spacing
                        if (all_visible) {
                            expect(card.get_allocation().x).toBe(x);
                            x += (CHILD_WIDTH + spacing);
                        }
                    } else {
                        expect(card.is_visible()).toBe(false);
                    }
                });
            });
        }

        // The responsive layout will consist of a 2 times the spacing padding on
        // the start then all the cards separated by spacing and an optional button
        // for a dropdown menu if not every card fits
        //
        // 2*spacing [card1] spacing [card2] ... [cardN] [Dropdown button]

        // At width=2000px, all ten cards should be visible with 50px spacing
        testSizingArrangementForDimensions(2000, 10, 50, true);
        // At width=1440px, all ten cards should be visible, with 40px spacing
        testSizingArrangementForDimensions(1440, 10, 40, true);
        // At width=1220px, all ten cards should be visible, with 20px spacing
        testSizingArrangementForDimensions(1220, 10, 20, true);
        // At width=1165px, all ten cards should be visible, with 15px spacing
        testSizingArrangementForDimensions(1165, 10, 15, true);
        // At width=1000px, all ten cards should be visible, with 0px spacing
        testSizingArrangementForDimensions(1000, 10, 0, true);
        // At width=900px, eight cards should be visible
        testSizingArrangementForDimensions(900, 8, 0, false);
        // At width=800px, seven cards should be visible
        testSizingArrangementForDimensions(800, 7, 0, false);
        // At width=700px, six cards should be visible
        testSizingArrangementForDimensions(700, 6, 0, false);
        // At width=200px, six cards should be visible
        testSizingArrangementForDimensions(200, 1, 0, false);

    });
});
