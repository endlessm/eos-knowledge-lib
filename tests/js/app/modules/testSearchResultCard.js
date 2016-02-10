const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const SearchResultCard = imports.app.modules.searchResultCard;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Search result card widget', function () {
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

Compliance.test_card_highlight_string_compliance(SearchResultCard.SearchResultCard);
