const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const ReaderWindow = imports.app.modules.readerWindow;

const EXPECTED_TOTAL_PAGES = 17;

describe('Window widget', function () {
    let view, app, factory;

    beforeAll(function (done) {
        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        app = new Endless.Application({
            application_id: id_string,
            flags: 0,
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

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('document-card', Minimal.MinimalDocumentCard);
        factory.add_named_mock('front-cover', MockWidgets.MockSidebarTemplate);
        factory.add_named_mock('back-cover', Minimal.MinimalBackCover);
        factory.add_named_mock('document-arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('lightbox', Minimal.MinimalLightbox);
        view = new ReaderWindow.ReaderWindow({
            application: app,
            factory: factory,
        });
        for (let i = 0; i < 15; i++) {
            let a = factory.create_named_module('document-card');
            view.append_article_page(a);
        }
    });

    afterEach(function () {
        view.destroy();
    });

    it('constructs', function () {});

    it('has a back-cover widget', function () {
        expect(view.back_cover).toBeA(Gtk.Widget);
    });

    it('has an overview-page widget', function () {
        expect(view.overview_page).toBeA(Gtk.Widget);
    });

    it('has a standalone-page widget', function () {
        expect(view.standalone_page).toBeA(Gtk.Widget);
    });

    it('has a nav-buttons widget', function () {
        expect(view.nav_buttons).toBeA(Gtk.Widget);
    });

    it('has a debug buttons widget', function () {
        expect(view.issue_nav_buttons).toBeA(Gtk.Widget);
    });

    it('contains 16 pages', function () {
        expect(view.total_pages).toMatch(String(EXPECTED_TOTAL_PAGES));
    });

    it('can remove all pages but the done page', function () {
        view.remove_all_article_pages();
        expect(view.total_pages).toBe(2);  // back-cover and overview page remain
    });

    it('throws an error when out of bounds pages are accessed', function () {
        expect(function () {
            view.show_article_page(400, true);
        }).toThrow();
        expect(function () {
            view.show_article_page(2, true);
        }).not.toThrow();
    });

    it('sets progress labels correctly', function () {
        let a = factory.create_named_module('document-card');
        view.append_article_page(a);
        expect(a.info_notice.current_page).toBe(EXPECTED_TOTAL_PAGES);
    });

    it('ensures visible page updates with show_*_page functions', function () {
        view.show_article_page(1);
        expect(view.article_pages_visible()).toBe(true);
        view.show_in_app_standalone_page();
        expect(view.article_pages_visible()).toBe(false);
    });
});
