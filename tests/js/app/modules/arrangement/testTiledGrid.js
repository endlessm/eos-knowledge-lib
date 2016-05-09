const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const TiledGrid = imports.app.modules.arrangement.tiledGrid;
const Utils = imports.tests.utils;

Compliance.test_arrangement_compliance(TiledGrid.TiledGrid);

describe('Tiled grid arrangement', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('order', Minimal.MinimalOrder);
        factory.add_named_mock('filter', Minimal.TitleFilter);
        factory.add_named_mock('arrangement', TiledGrid.TiledGrid, {
            'card-type': 'card',
            'order': 'order',
            'filter': 'filter',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    function add_cards(ncards) {
        Minimal.add_ordered_cards(arrangement, ncards);
        Minimal.add_filtered_cards(arrangement, 1, 0);
        Utils.update_gui();
        return factory.get_created_named_mocks('card');
    }

    function check_card_placement(card, left, top, width, height) {
        expect(arrangement.get_child_at(left, top)).toBe(card);
        // This doesn't work because of _two_ bugs:
        // gtk_container_child_get_property() isn't annotated correctly, and the
        // workaround that works in Python doesn't work in GJS.
        // https://bugzilla.gnome.org/show_bug.cgi?id=710645
        // https://bugzilla.gnome.org/show_bug.cgi?id=703412
        // expect(arrangement.child_get_property(card, 'width')).toBe(width);
        // expect(arrangement.child_get_property(card, 'height')).toBe(height);
    }

    it('packs four cards as 2x2', function () {
        let cards = add_cards(4);
        check_card_placement(cards[0], 0, 0, 1, 1);
        check_card_placement(cards[1], 1, 0, 1, 1);
        check_card_placement(cards[2], 0, 1, 1, 1);
        check_card_placement(cards[3], 1, 1, 1, 1);
    });

    it('packs six cards as 3x2', function () {
        let cards = add_cards(6);
        check_card_placement(cards[0], 0, 0, 1, 1);
        check_card_placement(cards[1], 1, 0, 1, 1);
        check_card_placement(cards[2], 2, 0, 1, 1);
        check_card_placement(cards[3], 0, 1, 1, 1);
        check_card_placement(cards[4], 1, 1, 1, 1);
        check_card_placement(cards[5], 2, 1, 1, 1);
    });

    it('packs eight cards as 4x2', function () {
        let cards = add_cards(8);
        check_card_placement(cards[0], 0, 0, 1, 1);
        check_card_placement(cards[1], 1, 0, 1, 1);
        check_card_placement(cards[2], 2, 0, 1, 1);
        check_card_placement(cards[3], 3, 0, 1, 1);
        check_card_placement(cards[4], 0, 1, 1, 1);
        check_card_placement(cards[5], 1, 1, 1, 1);
        check_card_placement(cards[6], 2, 1, 1, 1);
        check_card_placement(cards[7], 3, 1, 1, 1);
    });
});
