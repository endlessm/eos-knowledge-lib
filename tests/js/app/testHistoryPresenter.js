const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const Actions = imports.app.actions;
const HistoryPresenter = imports.app.historyPresenter;
const MockDispatcher = imports.tests.mockDispatcher;

describe('History Presenter', function () {
    let history_presenter;
    let history_model;
    let dispatcher;

    beforeEach(function () {
        history_model = new EosKnowledgePrivate.HistoryModel();
        dispatcher = MockDispatcher.mock_default();

        history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: history_model,
        });
    });

    it('can be constructed', function () {});

    it('can access a history item', function () {
        history_presenter.set_current_item_from_props({
            title: '',
            page_type: 'search',
        });
        let current_item = history_model.current_item;
        expect(current_item.title).toBe('');
    });

    it('does not duplicate the same item', function () {
        history_presenter.set_current_item_from_props({
            page_type: 'search',
            query: 'blah',
        });
        history_presenter.set_current_item_from_props({
            page_type: 'search',
            query: 'blah',
        });
        expect(history_presenter.history_model.can_go_back).toBeFalsy();
    });

    it('can go back', function () {
        history_presenter.set_current_item_from_props({
            query: 'first',
            page_type: 'search',
        });
        history_presenter.set_current_item_from_props({
            query: 'second',
            page_type: 'search',
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        let current_item = history_presenter.history_model.current_item;
        expect(current_item.query).toBe('first');
    });

    it('can go forward', function () {
        history_presenter.set_current_item_from_props({
            query: 'first',
            page_type: 'search',
        });
        history_presenter.set_current_item_from_props({
            query: 'second',
            page_type: 'search',
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        expect(history_model.current_item.query).toBe('first');

        dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        expect(history_model.current_item.query).toBe('second');
    });
});
