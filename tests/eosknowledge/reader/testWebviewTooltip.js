const EosKnowledge = imports.gi.EosKnowledge;

const CssClassMatcher = imports.CssClassMatcher;

describe('Webview tooltip', function () {
    let tooltip;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        tooltip = new EosKnowledge.Reader.WebviewTooltip();
    });

    it('constructs', function () {});

    it('has the correct CSS class', function () {
        expect(tooltip).toHaveCssClass(EosKnowledge.STYLE_CLASS_READER_WEBVIEW_TOOLTIP);
    });
});
