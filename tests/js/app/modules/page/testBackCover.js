const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const BackCover = imports.app.modules.page.backCover;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const ProgressLabel = imports.app.widgets.progressLabel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Back cover widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new BackCover.BackCover();
    });

    it('constructs', function () {});

    it('has a progress-label widget', function () {
        expect(page.progress_label).toBeDefined();
        expect(page.progress_label).not.toBe(null);
        expect(page.progress_label).toBeA(ProgressLabel.ProgressLabel);
    });

    it('has the back-cover CSS class', function () {
        expect(page).toHaveCssClass(StyleClasses.READER_BACK_COVER);
    });

    it('has a child widget with title CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_TITLE);
    });

    it('has a child widget with subtitle CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(StyleClasses.SUBTITLE);
    });
});
