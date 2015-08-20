const Gtk = imports.gi.Gtk;

const DonePage = imports.app.reader.donePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const ProgressLabel = imports.app.widgets.progressLabel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Done page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new DonePage.DonePage();
    });

    it('constructs', function () {});

    it('has a progress-label widget', function () {
        expect(page.progress_label).toBeDefined();
        expect(page.progress_label).not.toBe(null);
        expect(page.progress_label).toBeA(ProgressLabel.ProgressLabel);
    });

    it('has the done-page CSS class', function () {
        expect(page).toHaveCssClass(StyleClasses.READER_DONE_PAGE);
    });

    it('has a child widget with headline CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_HEADLINE);
    });

    it('has a child widget with bottom-line CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_BOTTOM_LINE);
    });
});
