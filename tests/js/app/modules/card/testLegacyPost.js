const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const LegacyPost = imports.app.modules.card.legacyPost;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Legacy Post Card', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new LegacyPost.LegacyPost({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass('legacy-post-card');
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
