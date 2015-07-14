const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const HistoryPresenter = imports.app.historyPresenter;
const MockWidgets = imports.tests.mockWidgets;

describe('History Presenter', function () {
    let history_presenter;
    let history_model;

    beforeEach(function () {
        history_model = new EosKnowledgePrivate.HistoryModel();

        history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: history_model,
            history_buttons: new MockWidgets.MockHistoryButtons(),
        });
    });

    it('can be constructed', function () {});

    it('can access a history item', function () {
        history_presenter.set_current_item({
            title: '',
            page_type: 'search',
            empty: false,
        });
        let current_item = history_presenter.history_model.current_item;
        expect(current_item.title).toBe('');
    });

    it('can go back', function () {
        history_presenter.set_current_item({
            title: 'first',
            page_type: 'search',
            empty: false,
        });
        history_presenter.set_current_item({
            title: 'second',
            page_type: 'search',
            empty: false,
        });
        history_presenter.go_back();
        let current_item = history_presenter.history_model.current_item;
        expect(current_item.title).toBe('first');
    });

    it('skips over empty queries when going back', function () {
        history_presenter.set_current_item({
            title: 'first',
            page_type: 'search',
            empty: false,
        });
        history_presenter.set_current_item({
            title: 'second',
            page_type: 'search',
            empty: true,
        });
        history_presenter.set_current_item({
            title: 'third',
            page_type: 'search',
            empty: false,
        });

        let model = history_presenter.history_model;
        expect(model.current_item.title).toBe('third');

        history_presenter.go_back();
        expect(model.current_item.title).toBe('first');
    });

    it('can go forward', function () {
        history_presenter.set_current_item({
            title: 'first',
            page_type: 'search',
            empty: false,
        });
        history_presenter.set_current_item({
            title: 'second',
            page_type: 'search',
            empty: false,
        });
        history_presenter.go_back();
        let model = history_presenter.history_model;
        expect(model.current_item.title).toBe('first');

        history_presenter.go_forward();
        expect(model.current_item.title).toBe('second');
    });

    it('skips over empty queries when going forward', function () {
        history_presenter.set_current_item({
            title: 'first',
            page_type: 'search',
            empty: false,
        });
        history_presenter.set_current_item({
            title: 'second',
            page_type: 'search',
            empty: true,
        });
        history_presenter.set_current_item({
            title: 'third',
            page_type: 'search',
            empty: false,
        });

        let model = history_presenter.history_model;
        expect(model.current_item.title).toBe('third');

        history_presenter.go_back();
        history_presenter.go_forward();
        expect(model.current_item.title).toBe('third');
    });
});
