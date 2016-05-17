const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Launcher = imports.app.interfaces.launcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SearchBox = imports.app.modules.navigation.searchBox;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const AppWindow = imports.app.modules.window.app;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
resource._register();

describe('Window', function () {
    let app, factory, dispatcher;

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
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('top-bar-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('item-group', MockWidgets.MockItemGroupModule);
        factory.add_named_mock('search-results', MockWidgets.MockItemGroupModule);
        factory.add_named_mock('home-page', Minimal.MinimalPage);
        factory.add_named_mock('section-page', Minimal.MinimalPage);
        factory.add_named_mock('search-page', Minimal.MinimalPage);
        factory.add_named_mock('article-page', Minimal.MinimalPage);
        factory.add_named_mock('all-sets-page', Minimal.MinimalPage);
        factory.add_named_mock('lightbox', Minimal.MinimalBinModule);
        factory.add_named_mock('navigation', Minimal.MinimalBinModule);
        factory.add_named_mock('brand-page', Minimal.MinimalPage);
        factory.add_named_mock('real-search-box', SearchBox.SearchBox);
        factory.add_named_mock('window', AppWindow.App, {
            'home-page': 'home-page',
            'section-page': 'section-page',
            'search-page': 'search-page',
            'article-page': 'article-page',
            'all-sets-page': 'all-sets-page',
            'navigation': 'navigation',
            'lightbox': 'lightbox',
            'search': 'top-bar-search',
        }, {
            application: app,
        });
        factory.add_named_mock('window-with-brand-page', AppWindow.App, {
            'brand-page': 'brand-page',
            'home-page': 'home-page',
            'section-page': 'section-page',
            'search-page': 'real-search-box',
            'article-page': 'article-page',
            'all-sets-page': 'all-sets-page',
            'search': 'top-bar-search',
        }, {
            application: app,
        });
        factory.add_named_mock('window-without-optional-pages', AppWindow.App, {
            'home-page': 'home-page',
            'search-page': 'real-search-box',
            'article-page': 'article-page',
            'search': 'top-bar-search',
        }, {
            application: app,
        });
    });

    describe('without brand page', function () {
        let view;

        beforeEach(function () {
            view = factory.create_named_module('window');
        });

        afterEach(function () {
            view.destroy();
        });

        it('can be constructed', function () {
            expect(view).toBeDefined();
        });

        it('correctly sets background image', function () {
            view.background_image_uri = BACKGROUND_URI;
            expect(view.background_image_uri).toBe(BACKGROUND_URI);
        });

        it('updates visible page with show_page', function () {
            let home_page = factory.get_created_named_mocks('home-page')[0];
            let section_page = factory.get_created_named_mocks('section-page')[0];
            let search_page = factory.get_created_named_mocks('search-page')[0];
            let article_page = factory.get_created_named_mocks('article-page')[0];
            let all_sets_page = factory.get_created_named_mocks('all-sets-page')[0];
            view.show_page(home_page);
            expect(view.get_visible_page()).toBe(home_page);
            view.show_page(section_page);
            expect(view.get_visible_page()).toBe(section_page);
            view.show_page(search_page);
            expect(view.get_visible_page()).toBe(search_page);
            view.show_page(article_page);
            expect(view.get_visible_page()).toBe(article_page);
            view.show_page(all_sets_page);
            expect(view.get_visible_page()).toBe(all_sets_page);
        });

        it('starts on home page', function () {
            let home_page = factory.get_created_named_mocks('home-page')[0];
            expect(view.get_visible_page()).toBe(home_page);
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
            let home_page = factory.get_created_named_mocks('home-page')[0];
            let other_page = factory.get_created_named_mocks('section-page')[0];
            expect(view._home_button).toBeDefined();
            view.show_page(other_page);
            expect(view._home_button.sensitive).toBe(true);
            view.show_page(home_page);
            expect(view._home_button.sensitive).toBe(false);
        });
    });

    describe('with a brand page and no lightbox / navigation', function () {
        let view;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            view = factory.create_named_module('window-with-brand-page');
        });

        afterEach(function () {
            view.destroy();
        });

        it('starts on the brand page page', function () {
            let brand_page = factory.get_created_named_mocks('brand-page')[0];
            expect(view.get_visible_page()).toBe(brand_page);
        });

        it('switches to the brand page when show-brand-page is dispatched', function () {
            let brand_page = factory.get_created_named_mocks('brand-page')[0];
            dispatcher.dispatch({
                action_type: Actions.SHOW_BRAND_PAGE,
            });
            expect(view.get_visible_page()).toBe(brand_page);
        });

        it('switches to the categories page after the show-all-sets page is dispatched', function () {
            let all_sets_page = factory.get_created_named_mocks('all-sets-page')[0];
            dispatcher.dispatch({
                action_type: Actions.SHOW_ALL_SETS_PAGE,
            });
            expect(view.get_visible_page()).toBe(all_sets_page);
        });

        it('still packs the pages even without a lightbox and navigation module', function () {
            let home_page = factory.get_created_named_mocks('home-page')[0];
            expect(view).toHaveDescendant(home_page);
        });

        it('shows the top bar search box on a page that has no search box', function () {
            dispatcher.dispatch({
                action_type: Actions.SHOW_HOME_PAGE,
            });
            Utils.update_gui();
            let search = factory.get_created_named_mocks('top-bar-search')[0];
            expect(search.get_child_visible()).toBeTruthy();
        });

        it('hides the top bar search on a page that has a search box', function () {
            dispatcher.dispatch({
                action_type: Actions.SHOW_SEARCH_PAGE,
            });
            Utils.update_gui();
            let search = factory.get_created_named_mocks('top-bar-search')[0];
            expect(search.get_child_visible()).toBeFalsy();
        });

        it('disables the home button when in the brand page', function () {
            let brand_page = factory.get_created_named_mocks('brand-page')[0];
            let other_page = factory.get_created_named_mocks('section-page')[0];
            expect(view._home_button).toBeDefined();
            view.show_page(other_page);
            expect(view._home_button.sensitive).toBe(true);
            view.show_page(brand_page);
            expect(view._home_button.sensitive).toBe(false);
        });
    });

    it('still works without all optional components', function () {
        let view;
        expect(() => {
            view = factory.create_named_module('window-without-optional-pages');
        }).not.toThrow();
        view.destroy();
    });
});
