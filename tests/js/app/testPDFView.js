const EvinceDocument = imports.gi.EvinceDocument;
const EvinceView = imports.gi.EvinceView;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const PDFView = imports.app.PDFView;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);
EvinceDocument.init();

describe('PDF view', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        view = new PDFView.PDFView();
    });

    it('constructs', function () {});

    it('opens pdfs in Evince', function () {
        let stream = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf').read(null);
        view.load_stream(stream, 'application/pdf');
        expect(view).toHaveDescendantWithClass(EvinceView.View);
    });

    describe('CSS style context', function () {
        it('has a pdf view class', function () {
            expect(view).toHaveCssClass(StyleClasses.PDF_VIEW);
        });
    });
});
