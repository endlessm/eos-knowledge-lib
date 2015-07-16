// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SearchModule = imports.app.modules.searchModule;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Search module', function () {
    let search_module;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-card', Minimal.MinimalCard);
        search_module = new SearchModule.SearchModule({
            factory: factory,
        });
    });

    it('constructs', function () {});

    it('has the correct CSS class', function () {
        expect(search_module).toHaveCssClass(StyleClasses.SEARCH_RESULTS);
    });

    it('has a label with headline CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.HEADLINE);
    });

    it('has a separator with separator CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(Gtk.STYLE_CLASS_SEPARATOR);
    });

    it('has an error page with error-page CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.READER_ERROR_PAGE);
    });

    it('has an OOPS! label with oops CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.OOPS);
    });

    it('has an error label with error-message CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.ERROR_MESSAGE);
    });

    it('displays the search page when a search is started', function () {
        search_module.visible_child_name = 'error';
        search_module.start_search('myfoobar');
        Utils.update_gui();
        expect(search_module.visible_child_name).toBe('results');
    });

    it('displays the search page when there are search results', function () {
        search_module.visible_child_name = 'error';
        search_module.finish_search([
            new ContentObjectModel.ContentObjectModel(),
        ]);
        Utils.update_gui();
        expect(search_module.visible_child_name).toBe('results');
    });

    it('displays the no results page when there are no results', function () {
        search_module.visible_child_name = 'error';
        search_module.finish_search([]);
        Utils.update_gui();
        expect(search_module.visible_child_name).toBe('no-results');
    });

    it('displays the error page when told to', function () {
        search_module.visible_child_name = 'results';
        search_module.finish_search_with_error(new Error());
        Utils.update_gui();
        expect(search_module.visible_child_name).toBe('error');
    });

    it('adds results to the card container', function () {
        search_module.finish_search([
            new ContentObjectModel.ContentObjectModel(),
        ]);
        Utils.update_gui();
        expect(search_module.results_box.get_children().length).toBe(1);
    });

    it('removes old results from the card container when adding new ones', function () {
        search_module.finish_search([
            new ContentObjectModel.ContentObjectModel(),
        ]);
        Utils.update_gui();
        search_module.finish_search([]);
        expect(search_module.results_box.get_children().length).toBe(0);
    });

    it('displays the query string somewhere in the UI', function () {
        expect(Gtk.test_find_label(search_module, '*myfoobar*')).toBeNull();
        search_module.start_search('myfoobar');
        Utils.update_gui();
        expect(Gtk.test_find_label(search_module, '*myfoobar*')).not.toBeNull();
    });
});
