const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

EosKnowledge.init();

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.article-page';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const EMACS_HTML = 'file://' + TESTDIR + '/test-content/emacs.html';
const BRAZIL_HTML = 'file://' + TESTDIR + '/test-content/Brazil.html';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTDIR + '/test-content/test-content.gresource');
        resource._register();

        let grid = new Gtk.Grid();
        let button = new Gtk.Button({ label: "Load a page" });
        let webview = new EosKnowledge.InjectableWebview({
            expand: true
        });
        grid.add(webview);
        grid.add(button);
        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(grid);
        window.show_all();
        button.connect('clicked', function () {
            if (webview.uri === null || webview.uri.indexOf('Brazil') !== -1) {
                webview.inject_css_from_resource('resource:///com/endlessm/thrones/stallman.css');
                webview.inject_js_from_resource('resource:///com/endlessm/thrones/stallman.js');
                webview.load_uri(EMACS_HTML);
            } else {
                webview.clear_injections();
                webview.load_uri(BRAZIL_HTML);
            }
        });
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
