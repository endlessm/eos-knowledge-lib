const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ReaderWindow = imports.app.modules.readerWindow;
const ArticlePage = imports.app.reader.articlePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;

const EXPECTED_TOTAL_PAGES = 17;

describe('Window widget', function () {
    let view;

    beforeEach(function (done) {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        Utils.register_gresource();

        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        let app = new Endless.Application({
            application_id: id_string,
            flags: 0,
        });
        let factory = new MockFactory.MockFactory();
        app.connect('startup', function () {
            view = new ReaderWindow.ReaderWindow({
                application: app,
                factory: factory,
            });
            for (let i = 0; i < 15; i++) {
                let a = new ArticlePage.ArticlePage();
                view.append_article_page(a);
            }
            done();
        });

        app.run([]);
    });

    afterEach(function () {
        view.destroy();
    });

    it('constructs', function () {});

    it('has a done-page widget', function () {
        expect(view.done_page).toBeA(Gtk.Widget);
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
        expect(view.total_pages).toBe(2);  // done-page and overview page remain
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
        let a = new ArticlePage.ArticlePage();
        view.append_article_page(a);
        expect(a.progress_label.current_page).toBe(EXPECTED_TOTAL_PAGES);
    });

    it('ensures visible page updates with show_*_page functions', function () {
        view.show_article_page(1);
        expect(view.article_pages_visible()).toBe(true);
        view.show_in_app_standalone_page();
        expect(view.article_pages_visible()).toBe(false);
    });
});
