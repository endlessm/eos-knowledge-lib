const Gtk = imports.gi.Gtk;

Gtk.init(null);

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const TiledGridArrangement = imports.app.modules.tiledGridArrangement;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Tiled grid arrangement', function () {
    let arrangement, cards;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        arrangement = new TiledGridArrangement.TiledGridArrangement();
        cards = [];
    });

    it('constructs', function () {
        expect(arrangement).toBeDefined();
    });

    function add_cards(ncards) {
        for (let ix = 0; ix < ncards; ix++)
            cards.push(new Minimal.MinimalCard({
                model: new ContentObjectModel.ContentObjectModel(),
            }));
        cards.forEach(arrangement.add_card, arrangement);
        Utils.update_gui();
    }

    it('adds cards to the list', function () {
        add_cards(3);
        cards.forEach((card) => expect(arrangement).toHaveDescendant(card));
        expect(arrangement.count).toBe(3);
    });

    it('removes cards from the list', function () {
        add_cards(3);
        arrangement.clear();
        Utils.update_gui();

        cards.forEach((card) => expect(arrangement).not.toHaveDescendant(card));
        expect(arrangement.count).toBe(0);
    });

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
        add_cards(4);
        check_card_placement(cards[0], 0, 0, 1, 1);
        check_card_placement(cards[1], 1, 0, 1, 1);
        check_card_placement(cards[2], 0, 1, 1, 1);
        check_card_placement(cards[3], 1, 1, 1, 1);
    });

    it('packs six cards as 3x2', function () {
        add_cards(6);
        check_card_placement(cards[0], 0, 0, 1, 1);
        check_card_placement(cards[1], 1, 0, 1, 1);
        check_card_placement(cards[2], 2, 0, 1, 1);
        check_card_placement(cards[3], 0, 1, 1, 1);
        check_card_placement(cards[4], 1, 1, 1, 1);
        check_card_placement(cards[5], 2, 1, 1, 1);
    });

    it('packs eight cards as 4x2', function () {
        add_cards(8);
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
