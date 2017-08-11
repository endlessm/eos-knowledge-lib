const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const {Video} = imports.app.modules.view.video;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('View.Video', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        view = new Video({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
        view.content_view.title = '';
        view.content_view.description = '';
    });

    it('has the correct style classes', function () {
        expect(view).toHaveDescendantWithCssClass('View__synopsis');
        expect(view).toHaveDescendantWithCssClass('ViewVideo__title');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(view, '*!!!*').use_markup).toBeTruthy();
    });

    it('has a video player', function () {
        expect(view).toHaveDescendantWithClass(EosKnowledgePrivate.MediaBin);
    });

    it('implements the ArticleContent interface', function (done) {
        expect(() => view.set_active(false)).not.toThrow();
        view.load_content_promise().then(done);
    });
});
