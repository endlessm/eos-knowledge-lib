const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const PostCard = imports.app.modules.postCard;
const SetObjectModel = imports.search.setObjectModel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Postcard widget', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new PostCard.PostCard({
            model: new ArticleObjectModel.ArticleObjectModel(),
        });

        expect(card).toHaveCssClass(StyleClasses.POST_CARD);
        expect(card).toHaveCssClass(StyleClasses.ARTICLE);
        expect(card).not.toHaveCssClass(StyleClasses.SET);

        card = new PostCard.PostCard({
            model: new SetObjectModel.SetObjectModel(),
        });
        expect(card).toHaveCssClass(StyleClasses.POST_CARD);
        expect(card).toHaveCssClass(StyleClasses.SET);
        expect(card).not.toHaveCssClass(StyleClasses.ARTICLE);
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
