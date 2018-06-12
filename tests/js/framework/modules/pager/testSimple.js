const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

Gtk.init(null);

const Actions = imports.framework.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HistoryStore = imports.framework.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Simple = imports.framework.modules.pager.simple;

describe('Pager.Simple', function () {
    let pager, factory, dispatcher, store;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        [pager, factory] = MockFactory.setup_tree({
            type: Simple.Simple,
            slots: {
                'home-page': { type: null },
                'set-page': { type: null },
                'search-page': { type: null },
                'article-page': { type: null },
                'all-sets-page': { type: null },
            },
        });
    });

    it('updates the visible page when dispatcher says so', function () {
        let home_page = factory.get_last_created('home-page');
        let set_page = factory.get_last_created('set-page');
        let search_page = factory.get_last_created('search-page');
        let article_page = factory.get_last_created('article-page');
        let all_sets_page = factory.get_last_created('all-sets-page');
        store.set_current_item_from_props({ page_type: 'home' });
        expect(pager.visible_child).toBe(home_page);
        store.set_current_item_from_props({ page_type: 'set' });
        expect(pager.visible_child).toBe(set_page);
        store.set_current_item_from_props({ page_type: 'search' });
        expect(pager.visible_child).toBe(search_page);
        store.set_current_item_from_props({ page_type: 'article' });
        expect(pager.visible_child).toBe(article_page);
        store.set_current_item_from_props({ page_type: 'all-sets' });
        expect(pager.visible_child).toBe(all_sets_page);
    });

    it('shows the first page in history immediately', function () {
        expect(pager.transition_duration).toBe(0);
        store.set_current_item_from_props({ page_type: 'home' });
        expect(pager.transition_duration).not.toBe(0);
        spyOn(pager, '_set_busy');
        expect(pager._set_busy).not.toHaveBeenCalledWith(true);
    });

    it('makes its home page ready', function () {
        let home_page = factory.get_last_created('home-page');
        spyOn(home_page, 'make_ready');
        pager.make_ready();
        expect(home_page.make_ready).toHaveBeenCalled();
    });

    // Need a way to reliably test this without relying on timing
    it('has the animating style class when animating');

    it('does not have the animating style class when not animating', function () {
        expect(pager).not.toHaveCssClass('PagerSimple--animating');
    });

    it('indicates busy while showing pages', function () {
        // First page will show immediately and not set busy
        store.set_current_item_from_props({ page_type: 'home' });
        spyOn(pager, '_set_busy');
        store.set_current_item_from_props({ page_type: 'set' });
        expect(pager._set_busy).toHaveBeenCalledWith(true);
    });

    it('adds the correct CSS classes to all its pages', function () {
        let home_page = factory.get_last_created('home-page');
        expect(home_page).toHaveCssClass('home-page');
        let set_page = factory.get_last_created('set-page');
        expect(set_page).toHaveCssClass('set-page');
        let search_page = factory.get_last_created('search-page');
        expect(search_page).toHaveCssClass('search-page');
        let article_page = factory.get_last_created('article-page');
        expect(article_page).toHaveCssClass('article-page');
        let all_sets_page = factory.get_last_created('all-sets-page');
        expect(all_sets_page).toHaveCssClass('all-sets-page');
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
