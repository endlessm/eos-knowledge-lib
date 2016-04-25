const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const LegacyPostCard = imports.app.modules.legacyPostCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Legacy Post Card', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new LegacyPostCard.LegacyPostCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(StyleClasses.LEGACY_POST_CARD);
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new LegacyPostCard.LegacyPostCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
