const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const ProgressLabel = imports.app.reader.progressLabel;
const CssClassMatcher = imports.tests.CssClassMatcher;

const EXPECTED_CURRENT_PAGE = 6;
const EXPECTED_TOTAL_PAGES = 15;

describe('Progress label', function () {
    let label;
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        label = new ProgressLabel.ProgressLabel({
            current_page: EXPECTED_CURRENT_PAGE,
            total_pages: EXPECTED_TOTAL_PAGES,
        });
    });

    it('constructs', function () {});

    it('has the progress-label CSS class', function () {
        expect(label).toHaveCssClass(EosKnowledgePrivate.STYLE_CLASS_READER_PROGRESS_LABEL);
    });

    it('contains the current page in its label', function () {
        expect(label.label).toMatch(String(EXPECTED_CURRENT_PAGE));
    });

    it('contains the total pages in its label', function () {
        expect(label.label).toMatch(String(EXPECTED_TOTAL_PAGES));
    });
});
