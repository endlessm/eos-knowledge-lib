const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const ListArrangement = imports.app.modules.listArrangement;
const Minimal = imports.tests.minimal;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('List arrangement', function () {
    let arrangement, cards;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        arrangement = new ListArrangement.ListArrangement();

        cards = [0, 1, 2].map(() => new Minimal.MinimalCard({
            model: new ContentObjectModel.ContentObjectModel(),
        }));
        cards.forEach(arrangement.add_card, arrangement);
        Utils.update_gui();
    });

    it('adds cards to the list', function () {
        cards.forEach((card) => expect(arrangement).toHaveDescendant(card));
    });

    it('removes cards from the list', function () {
        arrangement.clear();
        Utils.update_gui();
        cards.forEach((card) => expect(arrangement).not.toHaveDescendant(card));
    });
});
