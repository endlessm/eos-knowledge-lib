const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

function parse_object_from_path (path) {
    let [success, data] = path.load_contents(null);
    return JSON.parse(data);
}

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.reader.standalone-page';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load('tests/test-content/test-content.gresource');
resource._register();
let resource_path = Gio.File.new_for_uri('resource:///com/endlessm/thrones');

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let page = new EosKnowledge.Reader.StandalonePage();

        let app_info_file = resource_path.get_child('app.json');
        let app_json = parse_object_from_path(app_info_file);

        page.infobar.app_name = app_json['appTitle'];
        page.infobar.title_image_uri = app_json['titleImageURI'];
        page.infobar.background_image_uri = app_json['backgroundHomeURI'];

        let webview = new WebKit2.WebView();
        webview.load_uri('file://' +  TESTDIR + '/test-content/ipsum.html');
        page.article_page.show_content_view(webview);

        page.article_page.title_view.title = 'The Illuminati of Westeros: Who really controls the Iron Bank?';
        page.article_page.title_view.attribution = 'By Ser Pounce on May 31, 2015';
        page.article_page.get_style_context().add_class('article-page0');

        let window = new Endless.Window({
            application: this,
        });
        window.page_manager.add(page);
        window.show_all();
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
