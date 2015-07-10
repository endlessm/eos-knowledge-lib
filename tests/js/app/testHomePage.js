const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePage = imports.app.homePage;
const MockFactory = imports.tests.mockFactory;
const MockSearchBox = imports.tests.mockSearchBox;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Base home page class', function () {
    let home_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('home-search', MockSearchBox.MockSearchBox);
        home_page = new HomePage.HomePage({
            factory: factory,
        });
    });

    it('can be constructed', function () {});

    describe('CSS style context', function () {
        it('has home page class', function () {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE);
        });
    });
});
