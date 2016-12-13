const Eknc = imports.gi.EosKnowledgeContent;

const Actions = imports.app.actions;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;

describe('History Store', function () {
    let history_store;
    let dispatcher, reading_history;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();

        history_store = new HistoryStore.HistoryStore();
    });

    it('can access a history item', function () {
        history_store.set_current_item_from_props({
            page_type: 'search',
        });
        let current_item = history_store.get_current_item();
        expect(current_item.page_type).toBe('search');
    });

    it('does not duplicate the same item', function () {
        history_store.set_current_item_from_props({
            page_type: 'search',
            query: 'blah',
        });
        history_store.set_current_item_from_props({
            page_type: 'search',
            query: 'blah',
        });
        expect(history_store.get_items().length).toBe(1);
    });

    it('tracks the current query', function () {
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'blah',
        });
        expect(history_store.current_query).toBe('blah');
        let spy = jasmine.createSpy();
        history_store.connect('notify::current-query', spy);
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'gah',
        });
        expect(history_store.current_query).toBe('gah');
        expect(spy).toHaveBeenCalled();
    });

    it('tracks the current set', function () {
        let set1 = Eknc.SetObjectModel.new_from_props({ title: 'blah' });
        let set2 = Eknc.SetObjectModel.new_from_props({ title: 'gah' });
        history_store.set_current_item_from_props({
            page_type: Pages.SET,
            model: set1,
        });
        expect(history_store.current_set).toBe(set1);
        let spy = jasmine.createSpy();
        history_store.connect('notify::current-set', spy);
        history_store.set_current_item_from_props({
            page_type: Pages.SET,
            model: set2,
        });
        expect(history_store.current_set).toBe(set2);
        expect(spy).toHaveBeenCalled();
    });

    it('can go back', function () {
        history_store.set_current_item_from_props({
            query: 'first',
            page_type: 'search',
        });
        history_store.set_current_item_from_props({
            query: 'second',
            page_type: 'search',
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        let current_item = history_store.get_current_item();
        expect(current_item.query).toBe('first');
    });

    it('can go forward', function () {
        history_store.set_current_item_from_props({
            query: 'first',
            page_type: 'search',
        });
        history_store.set_current_item_from_props({
            query: 'second',
            page_type: 'search',
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        expect(history_store.get_current_item().query).toBe('first');

        dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        expect(history_store.get_current_item().query).toBe('second');
    });

    it('marks items as read', function () {
        let item = Eknc.ContentObjectModel.new_from_props({ ekn_id: 'foo', title: 'blah' });
        spyOn(reading_history, 'mark_article_read');

        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: item,
        });
        expect(reading_history.mark_article_read).toHaveBeenCalledWith('foo');
    });

    it('resets the article-search-visible state when changing', function () {
        history_store.set_current_item_from_props({
            page_type: 'home',
        });
        // Simulate accelerator key combo
        history_store.activate_action('article-search-visible', null);
        history_store.set_current_item_from_props({
            query: 'search',
            page_type: 'search',
        });
        expect(history_store.get_action_state('article-search-visible').unpack())
            .toBeFalsy();
    });
});
