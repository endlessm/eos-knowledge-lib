const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const {Audio} = imports.framework.modules.view.audio;
const CssClassMatcher = imports.tests.CssClassMatcher;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('View.Audio', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        view = new Audio({
            model: new DModel.Content({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(view).toHaveDescendantWithCssClass('View__synopsis');
        expect(view).toHaveDescendantWithCssClass('ViewAudio__title');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(view, '*!!!*').use_markup).toBeTruthy();
    });

    it('has a audio player', function () {
        expect(view).toHaveDescendantWithClass(EosKnowledgePrivate.MediaBin);
    });

    it('implements the ArticleContent interface', function (done) {
        expect(() => view.set_active(false)).not.toThrow();
        view.load_content_promise().then(done);
    });
});
