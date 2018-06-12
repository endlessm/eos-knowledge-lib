// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Quilt = imports.framework.modules.arrangement.quilt;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(Quilt.Quilt);

describe('Arrangement.Quilt', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: Quilt.Quilt,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            Minimal.add_cards(arrangement, 5);
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(arr_width, arr_height, visible_cards,
            primary_width, secondary_width, support_width, all_visible) {
            let message = 'handles arrangement for specified dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it (message, function () {
                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                expect(arrangement.all_visible).toBe(all_visible);

                let cards = factory.get_created('card');
                cards.forEach((card, i) => {
                    if (i < visible_cards) {
                        if (i === 0) {
                            expect(card.get_allocation().width).toBe(primary_width);
                        } else if (i === 1) {
                            expect(card.get_allocation().width).toBe(secondary_width);
                        } else {
                            expect(card.get_allocation().width).toBe(support_width);
                        }
                        expect(card.get_child_visible()).toBe(true);
                    } else {
                        expect(card.get_child_visible()).toBe(false);
                    }
                });
            });
        }

        // Note: Even though we add 5 models to the arrangement, only 4 models will actually
        // get added since an arrangement will discard any models in excess of get_max_cards(),
        // which in this case is 4. Therefore, all cards - that is, all 4 - are then visible
        // so all_visible is true.

        // At 2000x400, four cards should be visible; primary width=1000, secondary width=500,
        // support width=500. All cards visible
        testSizingArrangementForDimensions(2000, 400, 4, 1000, 500, 500, true);
        // At 1200x400, four cards should be visible; primary width=600, secondary width=300,
        // support width=300. All cards visible

        testSizingArrangementForDimensions(1200, 400, 4, 600, 300, 300, true);
        // At 1000x400, two cards should be visible; primary width=666, secondary width=333
        testSizingArrangementForDimensions(1000, 400, 2, 666, 333, 0, false);
        // At 900x300, two cards should be visible; primary width=514, secondary width=385
        testSizingArrangementForDimensions(900, 300, 2, 514, 385, 0, false);
        // At 800x300, two cards should be visible; primary width=457, secondary width=342
        testSizingArrangementForDimensions(800, 300, 2, 457, 342, 0, false);
    });
});
