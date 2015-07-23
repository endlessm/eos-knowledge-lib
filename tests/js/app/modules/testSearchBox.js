// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const CssClassMatcher = imports.tests.CssClassMatcher;
const SearchBox = imports.app.modules.searchBox;
const StyleClasses = imports.app.styleClasses;

describe('Search box module', function () {
    let box;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        box = new SearchBox.SearchBox();
    });

    it('constructs', function () {
        expect(box).toBeDefined();
    });

    it('has the correct style class', function () {
        expect(box).toHaveCssClass(StyleClasses.SEARCH_BOX);
    });
});
