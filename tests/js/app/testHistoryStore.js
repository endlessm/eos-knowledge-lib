const Actions = imports.app.actions;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;

describe('History Store', function () {
    let history_store;
    let dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();

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

    it('cannot go back from first item', function () {
        history_store.set_current_item_from_props({
            page_type: 'home',
        });
        let payload = dispatcher.last_payload_with_type(Actions.HISTORY_BACK_ENABLED_CHANGED);
        expect(!payload || !payload.enabled).toBeTruthy();
    });
});
