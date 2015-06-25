const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;
const TextCard = imports.app.textCard;

Gtk.init(null);

describe('Text card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new TextCard.TextCard();
    });

    it('has text card class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.TEXT_CARD);
    });
});
