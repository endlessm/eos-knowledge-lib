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
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const Window = imports.app.modules.window;

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
        factory.add_named_mock('search-page', Minimal.MinimalPage);
        factory.add_named_mock('article-page', Minimal.MinimalPage);
        factory.add_named_mock('lightbox', Minimal.MinimalLightbox);
        factory.add_named_mock('navigation', Minimal.MinimalNavigation);
        factory.add_named_mock('brand-screen', Minimal.MinimalPage);
        factory.add_named_mock('window', Window.Window, {
            'brand-screen': null,
            'home-page': 'home-page',
            'section-page': 'section-page',
            'search-page': 'search-page',
            'article-page': 'article-page',
            'navigation': 'navigation',
            'lightbox': 'lightbox',
            'search': 'top-bar-search',
        });
        factory.add_named_mock('window-with-brand-screen', Window.Window, {
            'brand-screen': 'brand-screen',
            'home-page': 'home-page',
            'section-page': 'section-page',
            'search-page': 'search-page',
            'article-page': 'article-page',
            'navigation': null,
            'lightbox': null,
            'search': 'top-bar-search',
        });
    });

    describe('without brand screen', function () {
        let view;

        beforeEach(function () {
            view = new Window.Window({
                application: app,
                factory: factory,
                factory_name: 'window',
            });
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
            view.show_page(home_page);
            expect(view.get_visible_page()).toBe(home_page);
            view.show_page(section_page);
            expect(view.get_visible_page()).toBe(section_page);
            view.show_page(search_page);
            expect(view.get_visible_page()).toBe(search_page);
            view.show_page(article_page);
            expect(view.get_visible_page()).toBe(article_page);
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

        it('presents itself when the app launches', function () {
            spyOn(view, 'show_all');
            spyOn(view, 'present');
            spyOn(view, 'present_with_time');
            dispatcher.dispatch({
                action_type: Actions.FIRST_LAUNCH,
                timestamp: 0,
                launch_type: Launcher.LaunchType.DESKTOP,
            });
            expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
        });
    });

    describe('with a brand screen and no lightbox / navigation', function () {
        let view;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

            view = new Window.Window({
                application: app,
                factory: factory,
                factory_name: 'window-with-brand-screen',
            });
        });

        afterEach(function () {
            view.destroy();
        });

        it('starts on the brand screen page', function () {
            let brand_screen = factory.get_created_named_mocks('brand-screen')[0];
            expect(view.get_visible_page()).toBe(brand_screen);
        });

        it('switches to the home page after the brand screen has been shown', function () {
            let home_page = factory.get_created_named_mocks('home-page')[0];
            dispatcher.dispatch({
                action_type: Actions.BRAND_SCREEN_DONE,
            });
            expect(view.get_visible_page()).toBe(home_page);
        });

        it('still packs the pages even without a lightbox and navigation module', function () {
            let home_page = factory.get_created_named_mocks('home-page')[0];
            expect(view).toHaveDescendant(home_page);
        });
    });
});
