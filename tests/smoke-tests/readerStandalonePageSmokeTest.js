const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticleObjectModel = imports.search.articleObjectModel;

const Utils = imports.tests.utils;
Utils.register_gresource();
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const StandalonePage = imports.app.reader.standalonePage;

function parse_object_from_path (path) {
    let [success, data] = path.load_contents(null);
    return JSON.parse(data);
}

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.reader.standalone-page';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

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
        let css_file = Gio.File.new_for_path('data/css/aisle.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        let dummy_content = Gio.File.new_for_path(TEST_CONTENT_DIR + 'emacs.html');

        let article_object = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: dummy_content.get_uri(),
            content_type: 'text/html',
            title: 'The Illuminati of Westeros: Who really controls the Iron Bank?',
        });

        let document_card = new ReaderDocumentCard.ReaderDocumentCard({
            model: article_object,
        });
        document_card.load_content(null, (card, task) => {
            card.load_content_finish(task);
        });
        let page = new StandalonePage.StandalonePage();
        page.document_card = document_card;

        let app_info_file = resource_path.get_child('app.json');
        let app_json = parse_object_from_path(app_info_file);

        page.app_name = app_json['appTitle'];
        page.infobar.archive_notice.label = "This article is part of the archive of the magazine Thrones.";
        page.infobar.title_image_uri = app_json['titleImageURI'];
        page.infobar.background_image_uri = app_json['backgroundHomeURI'];

        page.infobar.connect('response', () => {
            print("Open magazine");
        });

        let window = new Endless.Window({
            application: this,
        });
        window.page_manager.add(page);
        window.show_all();
        page.infobar.show();
        document_card.info_notice.hide();
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
