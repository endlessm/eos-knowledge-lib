const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const PostCard = imports.app.modules.postCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Postcard widget', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new PostCard.PostCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
        expect(card).toHaveCssClass(StyleClasses.POST_CARD);
    });

    it('has labels that understand Pango markup', function () {
        let card = new PostCard.PostCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
