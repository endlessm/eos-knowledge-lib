const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const ParallaxBackground = imports.app.modules.pager.parallaxBackground;

describe('Pager.ParallaxBackground', function () {
    let pager, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        [pager] = MockFactory.setup_tree({
            type: ParallaxBackground.ParallaxBackground,
            slots: {
                'home-page': { type: null },
                'section-page': { type: null },
                'search-page': { type: null },
                'article-page': { type: null },
            },
        });
    });

    it('sets the correct CSS classes on page transitions', function () {
        dispatcher.dispatch({ action_type: Actions.SHOW_HOME_PAGE });
        expect(pager).toHaveCssClass('PagerParallaxBackground--left');
        dispatcher.dispatch({ action_type: Actions.SHOW_SEARCH_PAGE });
        expect(pager).toHaveCssClass('PagerParallaxBackground--center');
        dispatcher.dispatch({ action_type: Actions.SHOW_SECTION_PAGE });
        expect(pager).toHaveCssClass('PagerParallaxBackground--center');
        dispatcher.dispatch({ action_type: Actions.SHOW_ARTICLE_PAGE });
        expect(pager).toHaveCssClass('PagerParallaxBackground--right');
    });
});
