const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Deck = imports.app.modules.card.deck;

Gtk.init(null);

describe('Card.Deck', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new Deck.Deck({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('CardDeck__contentFrame');
        expect(card).toHaveDescendantWithCssClass('CardDeck__title');
        expect(card).toHaveDescendantWithCssClass('CardDeck__thumbnail');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Deck.Deck);
