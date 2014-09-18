const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EvinceView = imports.gi.EvinceView;

const CssClassMatcher = imports.CssClassMatcher;
const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe('PDF view', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        view = new EosKnowledge.PDFView();
    });

    it('constructs', function () {});

    it('opens pdfs in Evince', function () {
        view.load_uri('file://' + TESTDIR + '/test-content/pdf-sample1.pdf');
        expect(view).toHaveDescendantWithClass(EvinceView.View);
    });

    describe('CSS style context', function () {
        it('has a pdf view class', function () {
            expect(view).toHaveCssClass(EosKnowledge.STYLE_CLASS_PDF_VIEW);
        });
    });
});
