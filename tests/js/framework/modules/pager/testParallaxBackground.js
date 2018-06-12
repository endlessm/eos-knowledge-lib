const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HistoryStore = imports.framework.historyStore;
const MockFactory = imports.tests.mockFactory;
const ParallaxBackground = imports.framework.modules.pager.parallaxBackground;

describe('Pager.ParallaxBackground', function () {
    let pager, store;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        [pager] = MockFactory.setup_tree({
            type: ParallaxBackground.ParallaxBackground,
            slots: {
                'home-page': { type: null },
                'set-page': { type: null },
                'search-page': { type: null },
                'article-page': { type: null },
            },
        });
    });

    it('sets the correct CSS classes on page transitions', function () {
        store.set_current_item_from_props({ page_type: 'home' });
        expect(pager).toHaveCssClass('PagerParallaxBackground--left');
        store.set_current_item_from_props({ page_type: 'search' });
        expect(pager).toHaveCssClass('PagerParallaxBackground--center');
        store.set_current_item_from_props({ page_type: 'set' });
        expect(pager).toHaveCssClass('PagerParallaxBackground--center');
        store.set_current_item_from_props({ page_type: 'article' });
        expect(pager).toHaveCssClass('PagerParallaxBackground--right');
    });
});
