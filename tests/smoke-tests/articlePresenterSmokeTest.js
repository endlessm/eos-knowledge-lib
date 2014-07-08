const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

EosKnowledge.init();

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.article_presenter';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/cyprus.jsonld';
// const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/cyprus-no-toc.jsonld';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {

        this.parent();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);
        let [success, data] = file.load_contents(null);
        let mockArticleData = JSON.parse(data);

        let articleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockArticleData);

        let view = new EosKnowledge.ArticlePage();
        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(view);

        let engine = new EosKnowledge.Engine();

        let presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
            engine: engine
        });
        articleObject.article_content_uri = "file://" + TESTDIR + "/test-content/Brazil.html";
        presenter.article_model = articleObject;
        window.show_all();

    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
