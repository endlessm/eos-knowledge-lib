const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const Launcher = imports.app.interfaces.launcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SearchBox = imports.app.modules.navigation.searchBox;
const Simple = imports.app.modules.pager.simple;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const AppWindow = imports.app.modules.window.app;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
resource._register();

describe('Window.App', function () {
    let app, dispatcher;

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
    });

    describe('in normal operation', function () {
        let view, factory;

        beforeEach(function () {
            [view, factory] = MockFactory.setup_tree({
                type: AppWindow.App,
                properties: {
                    application: app,
                },
                slots: {
                    'pager': {
                        type: Simple.Simple,
                        slots: {
                            'home-page': { type: null },
                            'search-page': { type: SearchBox.SearchBox },
                        },
                    },
                    'navigation': { type: null },
                    'lightbox': { type: null },
                    'search': { type: null },
                },
            });
        });

        afterEach(function () {
            view.destroy();
        });

        it('correctly sets background image', function () {
            view.background_image_uri = BACKGROUND_URI;
            expect(view.background_image_uri).toBe(BACKGROUND_URI);
        });

        it('indicates busy during a search', function () {
            spyOn(view, 'set_busy');
            dispatcher.dispatch({
                action_type: Actions.SEARCH_STARTED,
            });
            expect(view.set_busy).toHaveBeenCalledWith(true);
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
            });
            expect(view.set_busy).toHaveBeenCalledWith(false);
        });

        it('indicates busy during a failed search', function () {
            spyOn(view, 'set_busy');
            dispatcher.dispatch({
                action_type: Actions.SEARCH_STARTED,
            });
            expect(view.set_busy).toHaveBeenCalledWith(true);
            dispatcher.dispatch({
                action_type: Actions.SEARCH_FAILED,
            });
            expect(view.set_busy).toHaveBeenCalledWith(false);
        });

        it('indicates busy while querying a set', function () {
            spyOn(view, 'set_busy');
            dispatcher.dispatch({
                action_type: Actions.SHOW_SET,
            });
            expect(view.set_busy).toHaveBeenCalledWith(true);
            dispatcher.dispatch({
                action_type: Actions.SET_READY,
            });
            expect(view.set_busy).toHaveBeenCalledWith(false);
        });

        it('presents itself after the first page is shown', function () {
            spyOn(view, 'show_all');
            spyOn(view, 'present');
            spyOn(view, 'present_with_time');
            dispatcher.dispatch({
                action_type: Actions.PRESENT_WINDOW,
                timestamp: 0,
                launch_type: Launcher.LaunchType.DESKTOP,
            });
            expect(view.present).not.toHaveBeenCalled();
            expect(view.present_with_time).not.toHaveBeenCalled();
            dispatcher.dispatch({
                action_type: Actions.SHOW_HOME_PAGE,
                timestamp: 0,
                launch_type: Launcher.LaunchType.DESKTOP,
            });
            expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
        });

        it('disables the home button when in the home page', function () {
            expect(view._home_button).toBeDefined();
            dispatcher.dispatch({ action_type: Actions.SHOW_SECTION_PAGE });
            expect(view._home_button.sensitive).toBe(true);
            dispatcher.dispatch({ action_type: Actions.SHOW_HOME_PAGE });
            expect(view._home_button.sensitive).toBe(false);
        });

        it('disables the home button when in the brand page', function () {
            expect(view._home_button).toBeDefined();
            dispatcher.dispatch({ action_type: Actions.SHOW_SECTION_PAGE });
            expect(view._home_button.sensitive).toBe(true);
            dispatcher.dispatch({ action_type: Actions.SHOW_BRAND_PAGE });
            expect(view._home_button.sensitive).toBe(false);
        });

        it('shows the top bar search box on a page that has no search box', function () {
            dispatcher.dispatch({
                action_type: Actions.SHOW_HOME_PAGE,
            });
            Utils.update_gui();
            let search = factory.get_last_created('search');
            expect(search.get_child_visible()).toBeTruthy();
        });

        it('hides the top bar search on a page that has a search box', function () {
            dispatcher.dispatch({
                action_type: Actions.SHOW_SEARCH_PAGE,
            });
            Utils.update_gui();
            let search = factory.get_last_created('search');
            expect(search.get_child_visible()).toBeFalsy();
        });
    });

    it('still packs the pager even without a lightbox and navigation module', function () {
        let [view, factory] = MockFactory.setup_tree({
            type: AppWindow.App,
            properties: {
                'application': app,
            },
            slots: {
                'pager': { type: null },
                'search': { type: null },
            },
        });

        let pager = factory.get_last_created('pager');
        expect(view).toHaveDescendant(pager);
        view.destroy();
    });
});
