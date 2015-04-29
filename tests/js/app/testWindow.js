const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ArticlePage = imports.app.articlePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageA = imports.app.homePageA;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Lightbox = imports.app.lightbox;
const SectionPageA = imports.app.sectionPageA;
const Utils = imports.tests.utils;
const Window = imports.app.window;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();
const BACKGROUND_URI = 'resource:///com/endlessm/thrones/kings_landing.jpg';

describe('Window', function () {
    let view;

    beforeEach(function (done) {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
        resource._register();

        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        // FIXME In this version of GJS there is no Posix module, so fake the PID
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        let app = new Endless.Application({
            application_id: id_string,
            flags: 0
        });
        app.connect('startup', function () {
            view = new Window.Window({
                application: app
            });
            done();
        });

        app.run([]);
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
        expect(view.section_page).toBeA(SectionPageA.SectionPageA);
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

    it('visible page updates with show_*_page functions', function () {
        view.show_article_page();
        expect(view.get_visible_page()).toBe(view.article_page);
        view.show_section_page();
        expect(view.get_visible_page()).toBe(view.section_page);
        view.show_home_page();
        expect(view.get_visible_page()).toBe(view.home_page);
    });

    it('starts on home page', function () {
        expect(view.get_visible_page()).toBe(view.home_page);
    });
});
