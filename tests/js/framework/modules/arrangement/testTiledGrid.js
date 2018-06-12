const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const TiledGrid = imports.framework.modules.arrangement.tiledGrid;

Compliance.test_arrangement_compliance(TiledGrid.TiledGrid);

describe('Arrangement.TiledGrid', function () {
    let arrangement, factory;

    beforeEach(function () {
        [arrangement, factory] = MockFactory.setup_tree({
            type: TiledGrid.TiledGrid,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    function add_cards(ncards) {
        Minimal.add_cards(arrangement, ncards);
        Utils.update_gui();
        return factory.get_created('card');
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
