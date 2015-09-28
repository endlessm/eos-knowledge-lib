const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Lightbox = imports.app.widgets.lightbox;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const Window = imports.app.modules.window;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
resource._register();

describe('Window', function () {
    let app, view, dispatcher;

    beforeAll(function (done) {
        dispatcher = MockDispatcher.mock_default();

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

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('top-bar-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('item-group', MockWidgets.MockItemGroupModule);
        factory.add_named_mock('search-results', MockWidgets.MockItemGroupModule);
        factory.add_named_mock('home-page-template', Minimal.MinimalHomePage);
        factory.add_named_mock('lightbox', Minimal.MinimalLightbox);
        factory.add_named_mock('navigation', Minimal.MinimalNavigation);
        view = new Window.Window({
            application: app,
            factory: factory,
        });
    });

    afterEach(function () {
        view.destroy();
    });

    it('can be constructed', function () {
        expect(view).toBeDefined();
    });

    it('instantiates a home page A', function () {
        expect(view.home_page).toBeDefined();
    });

    it('instantiates a section page A', function () {
        expect(view.section_page).toBeDefined();
    });

    it ('instantiates a search page A', function () {
        expect(view.search_page).toBeDefined();
    });

    it('instantiates an article page A', function () {
        expect(view.article_page).toBeDefined();
    });

    it('correctly sets background image', function () {
        view.background_image_uri = BACKGROUND_URI;
        expect(view.background_image_uri).toBe(BACKGROUND_URI);
    });

    it('updates visible page with show_page', function () {
        view.show_page(view.article_page);
        expect(view.get_visible_page()).toBe(view.article_page);
        view.show_page(view.home_page);
        expect(view.get_visible_page()).toBe(view.home_page);
    });

    it('starts on home page', function () {
        expect(view.get_visible_page()).toBe(view.home_page);
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
});
