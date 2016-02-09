// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const ThirdRockArrangement = imports.app.modules.thirdRockArrangement;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(ThirdRockArrangement.ThirdRockArrangement);

describe('ThirdRock arrangement', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('arrangement', ThirdRockArrangement.ThirdRockArrangement, {
            'card-type': 'card',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            for (let i = 0; i < 10; i++) {
                let model = new ContentObjectModel.ContentObjectModel();
                arrangement.add_model(model);
            }
            win = new Gtk.OffscreenWindow();
            win.add(arrangement);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testSizingArrangementForDimensions(compact_mode, arr_width, arr_height, child_width) {
            let message = 'handles arrangement for specified dimensions' + ' (' + arr_width + 'x' + arr_height + ')';

            it(message, function () {
                arrangement.compact_mode = compact_mode;

                win.set_size_request(arr_width, arr_height);
                Utils.update_gui();

                expect(arrangement.get_allocation().height).toBe(arr_height);

                let all_cards = factory.get_created_named_mocks('card').reverse();

                all_cards.slice(0, 3).forEach((card) => {
                    expect(card.get_allocation().width).toBe(child_width);
                    expect(card.get_child_visible()).toBe(true);
                });

                all_cards.slice(3).forEach((card) => {
                    expect(card.get_child_visible()).toBe(false);
                });
            });
        }

        describe('on normal mode', function () {
            // On normal mode and width=1200, arrangement height=400, all cards of width=400
            testSizingArrangementForDimensions(false, 1200, 400, 400);
            // On normal mode and width=1000, arrangement height=400, all cards of width=333
            testSizingArrangementForDimensions(false, 1000, 400, 333);
            // On normal mode and width=900, arrangement height=400, all cards of width=300
            testSizingArrangementForDimensions(false, 900, 400, 300);
            // On normal mode and width=800, arrangement height=400, all cards of width=266
            testSizingArrangementForDimensions(false, 800, 400, 266);
            // On normal mode and width=600, arrangement height=300, all cards of width=200
            testSizingArrangementForDimensions(false, 600, 300, 200);
        });

        describe('on compact mode', function () {
            // On compact mode and width=1200, arrangement height=300, all cards of width=400
            testSizingArrangementForDimensions(true, 1200, 400, 400);
            // On compact mode and width=1000, arrangement height=300, all cards of width=333
            testSizingArrangementForDimensions(true, 1000, 400, 333);
            // On compact mode and width=900, arrangement height=300, all cards of width=300
            testSizingArrangementForDimensions(true, 900, 400, 300);
            // On compact mode and width=800, arrangement height=200, all cards of width=266
            testSizingArrangementForDimensions(true, 800, 300, 266);
            // On compact mode and width=600, arrangement height=200, all cards of width=200
            testSizingArrangementForDimensions(true, 600, 300, 200);
        });
    });
});
