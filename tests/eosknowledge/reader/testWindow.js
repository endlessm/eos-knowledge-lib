const CssClassMatcher = imports.CssClassMatcher;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const EXPECTED_CURRENT_PAGE = 0;
const EXPECTED_TOTAL_PAGES = 16;

describe('Window widget', function () {
    let view;

    beforeEach(function (done) {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        let app = new Endless.Application({
            application_id: id_string,
            flags: 0,
        });
        app.connect('startup', function () {
            view = new EosKnowledge.Reader.Window({
                application: app,
            });
            for (let i = 0; i < 15; i++) {
                let a = new EosKnowledge.Reader.ArticlePage({title : 'Example page #' + (i + 1)});
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
        expect(view.done_page).toBeDefined();
        expect(view.done_page).not.toBe(null);
    });

    it('has a nav-buttons widget', function () {
        expect(view.nav_buttons).toBeDefined();
        expect(view.nav_buttons).not.toBe(null);
    });

    it('starts on the zeroeth page', function () {
        expect(view.current_page).toMatch(String(EXPECTED_CURRENT_PAGE));
    });

    it('contains 16 pages', function () {
        expect(view.total_pages).toMatch(String(EXPECTED_TOTAL_PAGES));
    });

    it('can remove all pages but the done page', function () {
        view.remove_all_article_pages();
        expect(view.total_pages).toBe(1);  // done-page remains
    });

    it('throws an error when out of bounds pages are accessed', function () {
        expect(function () {
            view.current_page = EXPECTED_TOTAL_PAGES + 1;
        }).toThrow();
        expect(function () {
            view.current_page = EXPECTED_TOTAL_PAGES - 1;
        }).not.toThrow();
    });

    it('sets progress labels correctly', function () {    
        let a = new EosKnowledge.Reader.ArticlePage({title : "Example page #" + (EXPECTED_TOTAL_PAGES)});
        view.append_article_page(a);
        view.current_page = EXPECTED_TOTAL_PAGES;
        expect(a.progress_label.current_page).toBe(EXPECTED_TOTAL_PAGES);
    });
});
