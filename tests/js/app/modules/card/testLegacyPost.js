const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const LegacyPost = imports.app.modules.card.legacyPost;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Card.LegacyPost', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new LegacyPost.LegacyPost({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new LegacyPost.LegacyPost({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
