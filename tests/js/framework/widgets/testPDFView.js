const { DModel, EvinceDocument, EvinceView, Gio, Gtk } = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const PDFView = imports.framework.widgets.PDFView;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);
EvinceDocument.init();

describe('PDF view', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
    });

    describe('with pdf model ', function () {
        let pdf_view;
        beforeEach(function () {
            pdf_model = DModel.Article.new_from_props({
                content_type: 'application/pdf',
                title: 'Pdf title',
                can_export: true,
                can_print: true,
            });
            pdf_model.get_content_stream = () => {
                let file = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf');
                return file.read(null);
            };
            pdf_view = new PDFView.PDFView({
                model: pdf_model
            });
        });

        it('opens pdfs in Evince', function () {
            expect(pdf_view).toHaveDescendantWithClass(EvinceView.View);
        });

        it('has save and print buttons visible', function () {
            expect(pdf_view._save.visible).toBe(true);
            expect(pdf_view._print.visible).toBe(true);
        });
    });

    describe('with export and print disabled', function () {
        let pdf_view;
        beforeEach(function () {
            pdf_model = DModel.Article.new_from_props({
                content_type: 'application/pdf',
                title: 'Pdf title',
                can_export: false,
                can_print: false,
            });
            pdf_model.get_content_stream = () => {
                let file = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf');
                return file.read(null);
            };
            pdf_view = new PDFView.PDFView({
                model: pdf_model
            });
        });

        it('has save and print buttons hidden', function () {
            expect(pdf_view._save.visible).toBe(false);
            expect(pdf_view._print.visible).toBe(false);
        });
    });
});
