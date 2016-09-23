const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Post = imports.app.modules.card.post;

Gtk.init(null);

describe('Card.Post', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new Post.Post({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('CardPost__contentFrame');
        expect(card).toHaveDescendantWithCssClass('CardPost__title');
        expect(card).toHaveDescendantWithCssClass('CardPost__thumbnail');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Post.Post);
