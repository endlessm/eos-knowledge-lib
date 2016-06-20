const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Simple = imports.app.modules.pager.simple;

describe('Pager.Simple', function () {
    let pager, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();
    });

    describe('without brand page', function () {
        beforeEach(function () {
            [pager, factory] = MockFactory.setup_tree({
                type: Simple.Simple,
                slots: {
                    'home-page': { type: null },
                    'section-page': { type: null },
                    'search-page': { type: null },
                    'article-page': { type: null },
                    'all-sets-page': { type: null },
                },
            });
        });

        it('updates the visible page when dispatcher says so', function () {
            let home_page = factory.get_last_created('home-page');
            let section_page = factory.get_last_created('section-page');
            let search_page = factory.get_last_created('search-page');
            let article_page = factory.get_last_created('article-page');
            let all_sets_page = factory.get_last_created('all-sets-page');
            dispatcher.dispatch({ action_type: Actions.SHOW_HOME_PAGE });
            expect(pager.visible_child).toBe(home_page);
            dispatcher.dispatch({ action_type: Actions.SHOW_SECTION_PAGE });
            expect(pager.visible_child).toBe(section_page);
            dispatcher.dispatch({ action_type: Actions.SHOW_SEARCH_PAGE });
            expect(pager.visible_child).toBe(search_page);
            dispatcher.dispatch({ action_type: Actions.SHOW_ARTICLE_PAGE });
            expect(pager.visible_child).toBe(article_page);
            dispatcher.dispatch({ action_type: Actions.SHOW_ALL_SETS_PAGE });
            expect(pager.visible_child).toBe(all_sets_page);
        });

        it('starts on home page', function () {
            let home_page = factory.get_last_created('home-page');
            expect(pager.visible_child).toBe(home_page);
        });

        it('makes its home page ready', function () {
            let home_page = factory.get_last_created('home-page');
            spyOn(home_page, 'make_ready');
            pager.make_ready();
            expect(home_page.make_ready).toHaveBeenCalled();
        });

        it('dispatches the correct actions for the navigation back button', function () {
            let payload = dispatcher.last_payload_with_type(Actions.NAV_BACK_ENABLED_CHANGED);
            expect(payload.enabled).toBeFalsy();
            dispatcher.dispatch({ action_type: Actions.SHOW_SECTION_PAGE });
            payload = dispatcher.last_payload_with_type(Actions.NAV_BACK_ENABLED_CHANGED);
            expect(payload.enabled).toBeTruthy();
        });

        // Need a way to reliably test this without relying on timing
        it('has the animating style class when animating');

        it('does not have the animating style class when not animating', function () {
            expect(pager).not.toHaveCssClass('PagerSimple--animating');
        });
    });

    describe('with a brand page', function () {
        beforeEach(function () {
            [pager, factory] = MockFactory.setup_tree({
                type: Simple.Simple,
                slots: {
                    'brand-page': { type: null },
                    'home-page': { type: null },
                    'section-page': { type: null },
                    'search-page': { type: null },
                    'article-page': { type: null },
                    'all-sets-page': { type: null },
                },
            });
        });

        it('starts on the brand page', function () {
            let brand_page = factory.get_last_created('brand-page');
            expect(pager.visible_child).toBe(brand_page);
        });

        it('switches to the brand page when show-brand-page is dispatched', function () {
            let brand_page = factory.get_last_created('brand-page');
            dispatcher.dispatch({ action_type: Actions.SHOW_BRAND_PAGE });
            expect(pager.visible_child).toBe(brand_page);
        });

        it('adds the correct CSS classes to all its pages', function () {
            let brand_page = factory.get_last_created('brand-page');
            expect(brand_page).toHaveCssClass('brand-page');
            let home_page = factory.get_last_created('home-page');
            expect(home_page).toHaveCssClass('home-page');
            let section_page = factory.get_last_created('section-page');
            expect(section_page).toHaveCssClass('section-page');
            let search_page = factory.get_last_created('search-page');
            expect(search_page).toHaveCssClass('search-page');
            let article_page = factory.get_last_created('article-page');
            expect(article_page).toHaveCssClass('article-page');
            let all_sets_page = factory.get_last_created('all-sets-page');
            expect(all_sets_page).toHaveCssClass('all-sets-page');
        });
    });

    it('still works without all optional components', function () {
        expect(() => {
            [pager] = MockFactory.setup_tree({
                type: Simple.Simple,
                slots: {
                    'home-page': { type: null },
                },
            });
        }).not.toThrow();
    });
});
