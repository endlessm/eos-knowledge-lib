const {DModel, GObject, Gtk, Gio} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const EntryPoints = imports.app.entryPoints;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const WebShareDialog = imports.app.widgets.webShareDialog;

const Lang = imports.lang;

Gtk.init(null);

const DummyManager = new Lang.Class({
    Name: 'DummyManager',
    Extends: GObject.Object,
    Signals: {
        'object-added': { },
        'object-removed': { },
    },

    _init (props) {
        this.parent(props);
        this.get_objects = jasmine.createSpy().and.returnValue([]);
    }
});

describe('History Store', function () {
    let history_store;
    let dispatcher, reading_history;
    let start_content_access_metric_spy, stop_content_access_metric_spy;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();

        history_store = new HistoryStore.HistoryStore();
        start_content_access_metric_spy = spyOn(AppUtils, 'start_content_access_metric');
        stop_content_access_metric_spy = spyOn(AppUtils, 'stop_content_access_metric');
    });

    it('can access a history item', function () {
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
        });
        let current_item = history_store.get_current_item();
        expect(current_item.page_type).toBe(Pages.SEARCH);
    });

    it('does not duplicate the same item', function () {
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'blah',
        });
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'blah',
        });
        expect(history_store.get_items().length).toBe(1);
    });

    it('tracks the current search terms', function () {
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'blah',
        });
        expect(history_store.current_search_terms).toBe('blah');
        let spy = jasmine.createSpy();
        history_store.connect('notify::current-search-terms', spy);
        history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'gah',
        });
        expect(history_store.current_search_terms).toBe('gah');
        expect(spy).toHaveBeenCalled();
    });

    it('tracks the current set', function () {
        let set1 = new DModel.Set({title: 'blah'});
        let set2 = new DModel.Set({title: 'gah'});
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
            search_terms: 'first',
            page_type: Pages.SEARCH,
        });
        history_store.set_current_item_from_props({
            search_terms: 'second',
            page_type: Pages.SEARCH,
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        let current_item = history_store.get_current_item();
        expect(current_item.search_terms).toBe('first');
    });

    it('can go forward', function () {
        history_store.set_current_item_from_props({
            search_terms: 'first',
            page_type: Pages.SEARCH,
        });
        history_store.set_current_item_from_props({
            search_terms: 'second',
            page_type: Pages.SEARCH,
        });
        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        expect(history_store.get_current_item().search_terms).toBe('first');

        dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        expect(history_store.get_current_item().search_terms).toBe('second');
    });

    it('records metrics when using nav buttons', function () {
        model = new DModel.Article({
            id: 'ekn://article1',
        });
        history_store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: model
        });

        model = new DModel.Article({
            id: 'ekn://article2',
        });
        history_store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: model
        });

        dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        recent_start_call = start_content_access_metric_spy.calls.mostRecent();
        expect(recent_start_call.args[0].id).toEqual('ekn://article1');
        expect(recent_start_call.args[1]).toEqual(EntryPoints.NAV_BUTTON_CLICKED);

        dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        recent_stop_call = stop_content_access_metric_spy.calls.mostRecent();
        expect(recent_stop_call.args[0].id).toEqual('ekn://article1');
        recent_start_call = start_content_access_metric_spy.calls.mostRecent();
        expect(recent_start_call.args[0].id).toEqual('ekn://article2');
        expect(recent_start_call.args[1]).toEqual(EntryPoints.NAV_BUTTON_CLICKED);
    });

    it('marks items as read', function () {
        let item = new DModel.Content({
            id: 'foo',
            title: 'blah',
        });
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
            search_terms: 'search',
            page_type: 'search',
        });
        expect(history_store.get_action_state('article-search-visible').unpack())
            .toBeFalsy();
    });

    function test_share_action (network, network_uri_matcher) {
        history_store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: new DModel.Article({
                title: 'Endless OS',
                original_uri: 'http://endlessm.com',
            }),
        });
        let share_dialog;

        if (network === HistoryStore.Network.FACEBOOK) {
            let WebShareDialogConstructor = WebShareDialog.WebShareDialog;

            spyOn(WebShareDialog, 'WebShareDialog').and.callFake(function(props) {
                Gio.DBusObjectManagerClient.new_for_bus_sync = jasmine.createSpy().and.returnValue(new DummyManager())
                share_dialog = new WebShareDialogConstructor(props);
                return share_dialog;
            });
        } else {
            spyOn(Gtk, 'show_uri_on_window').and.callFake(function(a,uri,c) {
                expect(uri).toMatch('.*' + network_uri_matcher + '.*');
            });
        }
        spyOn(AppUtils, 'record_share_metric');

        dispatcher.dispatch({
            action_type: Actions.SHARE,
            network: network
        });

        if (network === HistoryStore.Network.FACEBOOK) {
            expect(WebShareDialog.WebShareDialog).toHaveBeenCalled();
            expect(share_dialog.uri).toMatch('.*' + network_uri_matcher + '.*');

            /* Close dialog, and give the main loop some time to actually do it */
            share_dialog.close();
            Utils.update_gui();

            /* Expect was_canceled to be true since we close the dialog */
            expect(AppUtils.record_share_metric)
                .toHaveBeenCalledWith(history_store.get_current_item().model, network, true);
        }
        else {
            expect(Gtk.show_uri_on_window).toHaveBeenCalled();
            expect(AppUtils.record_share_metric)
                .toHaveBeenCalledWith(history_store.get_current_item().model, network);
        }
    }

    it('can share a history item on Facebook', function () {
        test_share_action(HistoryStore.Network.FACEBOOK, 'facebook\\.com');
    });

    it('can share a history item on Twitter', function () {
        test_share_action(HistoryStore.Network.TWITTER, 'twitter\\.com');
    });

    it('can share a history item on Whatsapp', function () {
        test_share_action(HistoryStore.Network.WHATSAPP, 'api\\.whatsapp\\.com');
    });
});
