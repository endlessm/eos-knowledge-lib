const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const OverviewPage = imports.app.reader.overviewPage;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Overview page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('front-cover', MockWidgets.MockSidebarTemplate);
        page = new OverviewPage.OverviewPage({
            factory: factory,
        });
    });

    it('constructs', function () {});

    it('has the overview-page CSS class', function () {
        expect(page).toHaveCssClass(StyleClasses.READER_OVERVIEW_PAGE);
    });
});
