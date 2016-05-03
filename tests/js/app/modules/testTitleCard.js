const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;
const TitleCard = imports.app.modules.titleCard;

Gtk.init(null);

describe('Title card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new TitleCard.TitleCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('has card and title-card class', function () {
        expect(card).toHaveCssClass(StyleClasses.CARD);
        expect(card).toHaveCssClass(StyleClasses.TITLE_CARD);
    });

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('has a widget with before class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.BEFORE);
    });

    it('has a widget with after class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.AFTER);
    });

    it('has labels that understand Pango markup', function () {
        let card = new TitleCard.TitleCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
