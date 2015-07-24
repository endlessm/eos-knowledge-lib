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

    it('has card and text-card class', function () {
        expect(card).toHaveCssClass(StyleClasses.CARD);
        expect(card).toHaveCssClass(StyleClasses.TEXT_CARD);
    });

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('has a decoration widget with decoration class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.DECORATION);
    });

    it('has labels that understand Pango markup', function () {
        let card = new TextCard.TextCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
