const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.articlePresenter';

const TESTDIR = Endless.getCurrentFileDir() + '/..';

// Path to test-content without the '..'
const TESTDATADIR = Endless.getCurrentFileDir().slice(0, -1 * "smoke-tests/".length) + "/test-content";

imports.searchPath.unshift(TESTDIR);
const utils = imports.utils;

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,
    
    vfunc_startup: function () {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let greyjoyModel = this._get_faked_model("greyjoy-article.jsonld", "house_greyjoy.html");
        let martellModel = this._get_faked_model("martell-article.jsonld", "house_martell.html");
        let mockEngine = new FakeEngine([greyjoyModel, martellModel]);

        let articleView = new EosKnowledge.ArticlePageA();

        let articlePresenter = new EosKnowledge.ArticlePresenter(articleView, mockEngine);
        articlePresenter.load_article_from_model(greyjoyModel);

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(articleView);
        window.show_all();
    },

    // The models for this smoke test are made from faked JSONLD docs,
    // whose URI paths will need to be replaced at runtime to ensure
    // they point to the right static HTML files
    _get_faked_model: function (modelFilename, htmlFilename) {

        // replace the LOCALFILE placeholder URIs with real path to
        // htmlFilename
        let actualLocation = "file://" + TESTDATADIR + "/" + htmlFilename;
        let jsonld = utils.parse_object_from_path(TESTDATADIR + "/" + modelFilename);

        // make an article model whose content_uri is the HTML filepath
        let articleModel = new EosKnowledge.ArticleObjectModel.new_from_json_ld(jsonld);
        articleModel.article_content_uri = actualLocation;

        return articleModel
    }
});

const FakeEngine = function (models) {
    this._db = {};
    for (let i in models) {
        let model = models[i];
        let [domain, id] = model.ekn_id.split('/').slice(-2);
        this._db[id] = model;
    }
}

FakeEngine.prototype = {
    get_object_by_id: function (domain, id, cb) {
        cb(undefined, this._db[id]);
    },

    query_objects: function (domain, query, cb) {
        cb("lol search isn't real", undefined);
    }
}

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
