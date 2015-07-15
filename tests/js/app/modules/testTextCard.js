const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;
const TextCard = imports.app.modules.textCard;

Gtk.init(null);

describe('Text card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new TextCard.TextCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('has text card class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.TEXT_CARD);
    });
});
