const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ReaderBackCover = imports.app.modules.readerBackCover;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const ProgressLabel = imports.app.reader.progressLabel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Done page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new ReaderBackCover.ReaderBackCover();
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
