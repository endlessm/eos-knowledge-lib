const EosKnowledge = imports.gi.EosKnowledge;

const WebviewTooltip = imports.app.reader.webviewTooltip;
const CssClassMatcher = imports.tests.CssClassMatcher;

describe('Webview tooltip', function () {
    let tooltip;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        tooltip = new WebviewTooltip.WebviewTooltip();
    });

    it('constructs', function () {});

    it('has the correct CSS class', function () {
        expect(tooltip).toHaveCssClass(EosKnowledge.STYLE_CLASS_READER_WEBVIEW_TOOLTIP);
    });
});
