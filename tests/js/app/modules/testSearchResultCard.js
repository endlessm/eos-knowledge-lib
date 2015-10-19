const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const SearchResultCard = imports.app.modules.searchResultCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card widget', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new SearchResultCard.SearchResultCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
        expect(card).toHaveCssClass(StyleClasses.SEARCH_RESULT_CARD);
    });

    it('has labels that understand Pango markup', function () {
        let card = new SearchResultCard.SearchResultCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});
