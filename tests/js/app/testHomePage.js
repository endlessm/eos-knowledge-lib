const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockSearchBox = imports.tests.mockSearchBox;

Gtk.init(null);

describe('Base home page class', function () {
    let home_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('home-search', MockSearchBox.MockSearchBox);
        home_page = new Minimal.MinimalHomePage({
            factory: factory,
        });
    });

    it('can be constructed', function () {});
});
