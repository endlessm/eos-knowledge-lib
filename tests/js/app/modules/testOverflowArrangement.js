const Gtk = imports.gi.Gtk;

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const OverflowArrangement = imports.app.modules.overflowArrangement;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Overflow arrangement', function () {
    let arrangement, cards;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        arrangement = new OverflowArrangement.OverflowArrangement();
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
        expect(arrangement.get_cards().length).toBe(3);
    });

    it('removes cards from the list', function () {
        add_cards(3);
        arrangement.clear();
        Utils.update_gui();

        cards.forEach((card) => expect(arrangement).not.toHaveDescendant(card));
        expect(arrangement.get_cards().length).toBe(0);
    });
});
