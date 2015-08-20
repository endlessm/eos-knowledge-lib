const Gtk = imports.gi.Gtk;

const WebviewTooltip = imports.app.widgets.webviewTooltip;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Webview tooltip', function () {
    let tooltip;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        tooltip = new WebviewTooltip.WebviewTooltip();
    });

    it('constructs', function () {});

    it('has the correct CSS class', function () {
        expect(tooltip).toHaveCssClass(StyleClasses.READER_WEBVIEW_TOOLTIP);
    });
});
