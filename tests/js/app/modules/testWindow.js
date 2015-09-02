const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticlePage = imports.app.articlePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageA = imports.app.homePageA;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Lightbox = imports.app.widgets.lightbox;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const Window = imports.app.modules.window;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
resource._register();

describe('Window', function () {
    let app, view;

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

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('top-bar-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('home-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('item-group', MockWidgets.MockItemGroupModule);
        factory.add_named_mock('search-results', MockWidgets.MockItemGroupModule);
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
        expect(view.home_page).toBeA(HomePageA.HomePageA);
    });

    it('instantiates a section page A', function () {
        expect(view.section_page).toBeDefined();
    });

    it ('instantiates a search page A', function () {
        expect(view.search_page).toBeDefined();
    });

    it('instantiates an article page A', function () {
        expect(view.article_page).toBeA(ArticlePage.ArticlePage);
    });

    it('instantiates a lightbox', function () {
        expect(view.lightbox).toBeA(Lightbox.Lightbox);
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
});
