const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const ARTICLE_MODELS = [
    {
        ekn_id: 'ekn://diy-es/0000000000000001',
        title: 'Article One',
        authors: ['plward11'],
        published: 'September 30, 2014',
        articleNumber: 0,
        html: '<a href="http://www.google.com">Google</a>'
    },
    {
        ekn_id: 'ekn://diy-es/0000000000000002',
        title: 'Article Two',
        authors: ['ffarfan'],
        articleNumber: 1,
        html: '<a href="ekn://diy-es/0000000000000003">This is an in-issue link</a>. You should see the tooltip pointing to Page 4.',
    },
    {
        ekn_id: 'ekn://diy-es/0000000000000003',
        title: 'Article Three',
        published: 'September 30, 2014',
        articleNumber: 2,
        html: '<a href="ekn://diy-es/0000000000000f00">To the archive!</a>. This tooltip should show the "ARCHIVE" legend.',
    },
    {
        ekn_id: 'ekn://diy-es/0000000000000004',
        title: 'Article Four (Cheese)',
        published: 'February 13, 2015',
        synopsis: 'Cheese is really expensive in Canada...',
        authors: ['ptomato'],
        articleNumber: 3,
    },
    {
        ekn_id: 'ekn://diy-es/0000000000000f00',
        articleNumber: 42,
        title: 'Article Forty Two',
        published: 'April 2, 1979',
        authors: ['Douglas Adams'],
        html: 'Time is an illusion. Lunchtime doubly so.',
    }
];

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load('tests/test-content/test-content.gresource');
resource._register();
let resource_path = Gio.File.new_for_uri('resource:///com/endlessm/thrones');

// Mock out the engine so that we aren't looking for an eos-thrones database
let mock_engine = new EosKnowledgeSearch.Engine.get_default();
mock_engine.get_object_by_id = function (ekn_id, callback) {
    let props = ARTICLE_MODELS.filter((obj) => {
        return obj.ekn_id === ekn_id;
    })[0];

    let authors;
    if (props.hasOwnProperty('authors')) {
        authors = props.authors;
        delete props.authors;
    }
    let article = new EosKnowledgeSearch.ArticleObjectModel(props);
    if (authors)
        article.set_authors(authors);
    callback(undefined, article);
};
mock_engine.get_objects_by_query = function (query, callback) {
    // We slice the global ARTICLE_MODELS array to bring only the first four articles.
    callback(undefined, ARTICLE_MODELS.slice(0, 3).map((props) => {
        let authors = props.authors;
        delete props.authors;
        let model = new EosKnowledgeSearch.ArticleObjectModel(props);
        if (authors)
            model.set_authors(authors);
        return model;
    }));
};
mock_engine.get_xapian_uri = function () {};

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    _init: function (props) {
        this.parent(props);
    },

    vfunc_startup: function () {
        this.parent();

        let [success, app_json, len, etag] = resource_path.get_child('app.json')
            .load_contents(null);

        let presenter = new EosKnowledge.Reader.Presenter(JSON.parse(app_json), {
            engine: mock_engine,
            application: this,
        });
        presenter.desktop_launch(0);
    },
});

let app = new TestApplication({
    application_id: 'com.endlessm.knowledge.readerPresenterSmokeTest',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
});
app.run(ARGV);
