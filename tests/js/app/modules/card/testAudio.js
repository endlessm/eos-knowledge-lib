const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Audio = imports.app.modules.card.audio;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Card.Audio', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        card = new Audio.Audio({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('Card__synopsis');
        expect(card).toHaveDescendantWithCssClass('CardAudio__title');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });

    it('has a audio player', function () {
        expect(card).toHaveDescendantWithClass(EosKnowledgePrivate.MediaBin);
    });

    it('implements the ArticleContent interface', function (done) {
        expect(() => card.set_active(false)).not.toThrow();
        card.load_content_promise().then(done);
    });
});

Compliance.test_card_compliance(Audio.Audio);
