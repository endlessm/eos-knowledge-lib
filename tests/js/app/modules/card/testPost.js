const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Post = imports.app.modules.card.post;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

describe('Postcard widget', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new Post.Post({
            model: new ArticleObjectModel.ArticleObjectModel(),
        });

        expect(card).toHaveCssClass('post-card');
        expect(card).toHaveCssClass('article');
        expect(card).not.toHaveCssClass('set');

        card = new Post.Post({
            model: new SetObjectModel.SetObjectModel(),
        });
        expect(card).toHaveCssClass('post-card');
        expect(card).toHaveCssClass('set');
        expect(card).not.toHaveCssClass('article');
    });

    it('has labels that understand Pango markup', function () {
        let card = new Post.Post({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
