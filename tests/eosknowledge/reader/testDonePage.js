const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const InstanceOfMatcher = imports.InstanceOfMatcher;

describe('Done page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new EosKnowledge.Reader.DonePage();
    });

    it('constructs', function () {});

    it('has a progress-label widget', function () {
        expect(page.progress_label).toBeDefined();
        expect(page.progress_label).not.toBe(null);
        expect(page.progress_label).toBeA(EosKnowledge.Reader.ProgressLabel);
    });

    it('has the done-page CSS class', function () {
        expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_READER_DONE_PAGE);
    });

    it('has a child widget with headline CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_HEADLINE);
    });

    it('has a child widget with bottom-line CSS class', function () {
        expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_BOTTOM_LINE);
    });
});
