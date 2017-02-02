const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Video = imports.app.modules.card.video;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Card.Video', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        card = new Video.Video({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('Card__synopsis');
        expect(card).toHaveDescendantWithCssClass('CardVideo__title');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });

    it('has a video player', function () {
        expect(card).toHaveDescendantWithClass(EosKnowledgePrivate.MediaBin);
    });

    it('implements the ArticleContent interface', function (done) {
        expect(() => card.set_active(false)).not.toThrow();
        card.load_content_promise().then(done);
    });
});

Compliance.test_card_compliance(Video.Video);
