const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.article-page';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const BRAZIL_HTML = 'file://' + TESTDIR + '/test-content/Brazil.html';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTDIR + '/test-content/test-content.gresource');
        resource._register();

        let webview = new EosKnowledge.EknWebview({
            expand: true
        });
        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(webview);
        window.show_all();
        webview.load_uri(BRAZIL_HTML);
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
