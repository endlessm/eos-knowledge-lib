const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.framework.actions;
const HistoryStore = imports.framework.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const PagerSimple = imports.framework.modules.pager.simple;
const Pages = imports.framework.pages;
const SearchBox = imports.framework.modules.navigation.searchBox;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const WindowSimple = imports.framework.modules.window.simple;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
resource._register();

describe('Window.Simple', function () {
    let app, dispatcher, view, factory, history;

    beforeAll(function (done) {
        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        // FIXME In this version of GJS there is no Posix module, so fake the PID
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        app = new Endless.Application({
            application_id: id_string,
            flags: 0
        });
        app.connect('startup', done);
        app.hold();
        app.run([]);
    });

    afterAll(function () {
        app.release();
    });

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        history = new HistoryStore.HistoryStore();
        HistoryStore.set_default(history);
        [view, factory] = MockFactory.setup_tree({
            type: WindowSimple.Simple,
            properties: {
                application: app,
            },
            slots: {
                'content': {
                    type: PagerSimple.Simple,
                    slots: {
                        'home-page': { type: null },
                        'search-page': { type: SearchBox.SearchBox },
                    },
                },
                'search': { type: null },
            },
        });
    });

    afterEach(function () {
        view.destroy();
    });

    it('packs its content', function () {
        let content = factory.get_last_created('content');
        expect(view).toHaveDescendant(content);
    });

    function test_launch_action (action, descriptor) {
        describe('on ' + descriptor, function () {
            beforeEach(function () {
                spyOn(view, 'show_all');  // stub out
                spyOn(view, 'present');
                spyOn(view, 'present_with_time');
            });

            it('presents itself after the first page is shown', function () {
                dispatcher.dispatch({
                    action_type: action,
                    timestamp: 0,
                });
                expect(view.present).not.toHaveBeenCalled();
                expect(view.present_with_time).not.toHaveBeenCalled();
                history.set_current_item_from_props({
                    page_type: Pages.HOME,
                });
                expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
            });

            it('does not present itself until the action is dispatched', function () {
                history.set_current_item_from_props({
                    page_type: Pages.HOME,
                });
                expect(view.present).not.toHaveBeenCalled();
                expect(view.present_with_time).not.toHaveBeenCalled();
                dispatcher.dispatch({
                    action_type: action,
                    timestamp: 0,
                });
                expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
            });
        });
    }
    test_launch_action(Actions.LAUNCHED_FROM_DESKTOP, 'desktop launch');
    test_launch_action(Actions.DBUS_LOAD_QUERY_CALLED,
        'desktop search open');
    test_launch_action(Actions.DBUS_LOAD_ITEM_CALLED,
        'desktop search result open');

    it('disables the home button when in the home page', function () {
        expect(view._home_button).toBeDefined();
        history.set_current_item_from_props({ page_type: Pages.SET });
        expect(view._home_button.sensitive).toBe(true);
        history.set_current_item_from_props({ page_type: Pages.HOME });
        expect(view._home_button.sensitive).toBe(false);
    });

    it('shows the top bar search box on a page that has no search box', function () {
        history.set_current_item_from_props({ page_type: Pages.HOME });
        let search = factory.get_last_created('search');
        expect(search.get_child_visible()).toBeTruthy();
    });

    it('hides the top bar search on a page that has a search box', function () {
        history.set_current_item_from_props({ page_type: Pages.SEARCH });
        let search = factory.get_last_created('search');
        expect(search.get_child_visible()).toBeFalsy();
    });

    it('enables and disables the history back button', function () {
        history.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        Utils.update_gui();
        expect(view._history_buttons.back_button.sensitive).toBeFalsy();
        history.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        Utils.update_gui();
        expect(view._history_buttons.back_button.sensitive).toBeTruthy();
    });

    it('enables and disables the history forward button', function () {
        history.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        Utils.update_gui();
        expect(view._history_buttons.forward_button.sensitive).toBeFalsy();
        history.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        history.go_back();
        Utils.update_gui();
        expect(view._history_buttons.forward_button.sensitive).toBeTruthy();
    });
});
