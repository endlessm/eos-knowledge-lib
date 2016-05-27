const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const List = imports.app.modules.card.list;

Gtk.init(null);

describe('Card.List', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new List.List({
            model: new ContentObjectModel.ContentObjectModel(),
        });
        expect(card).toHaveCssClass('list-card');
    });

    it('has labels that understand Pango markup', function () {
        let card = new List.List({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            }),
            navigation_context: '???',
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*???*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_highlight_string_compliance(List.List);
