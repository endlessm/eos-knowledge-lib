const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load('tests/test-content/test-content.gresource');
resource._register();
let resource_path = Gio.File.new_for_uri('resource:///com/endlessm/thrones');

// Mock out the engine so that we aren't looking for an eos-thrones database
let mock_engine = new EosKnowledgeSearch.Engine();
mock_engine.get_object_by_id = function (ekn_id, callback) {
    let props;
    if (ekn_id === 'ekn://article-foo/') {
        props = {
            ekn_id: 'ekn://article-foo/',
            articleNumber: 42,
            title: 'Article Forty Two',
            published: 'April 2, 1979',
            authors: ['Douglas Adams'],
            html: 'Time is an illusion. Lunchtime doubly so.',
        };
    } else if (ekn_id === 'ekn://article3/') {
        props = {
            ekn_id: 'ekn://article3/',
            articleNumber: 2,
            title: 'Article Three',
            published: 'September 30, 2014',
            html: '<a href="ekn://article-foo/">To the archive!</a>. This tooltip should show the "ARCHIVE" legend.',
        };
    }
    let authors = props.authors;
    delete props.authors;
    let article = new EosKnowledgeSearch.ArticleObjectModel(props);
    if (authors)
        article.set_authors(authors);
    callback(undefined, article);
};
mock_engine.get_objects_by_query = function (query, callback) {
    const OBJECTS = [
        {
            title: 'Article One',
            authors: ['Plward11'],
            published: 'September 30, 2014',
            ekn_id: 'ekn://article1/',
            articleNumber: 0,
            html: '<a href="http://www.google.com">Google</a>'
        },
        {
            title: 'Article Two',
            authors: ['Ffarfan'],
            ekn_id: 'ekn://article2/',
            articleNumber: 1,
            html: '<a href="ekn://article3/">This is an in-issue link</a>. You should see the tooltip pointing to Page 4.',
        },
        {
            title: 'Article Three',
            published: 'September 30, 2014',
            ekn_id: 'ekn://article3/',
            articleNumber: 2,
            html: '<a href="ekn://article-foo/">To the archive!</a>. This tooltip should show the "ARCHIVE" legend.',
        },
        {
            title: 'Article Four (Cheese)',
            published: 'February 13, 2015',
            synopsis: 'Cheese is really expensive in Canada...',
            authors: ['Ptomato'],
            ekn_id: 'ekn://article4/',
            articleNumber: 3,
        }
    ];
    callback(undefined, OBJECTS.slice(0, query.limit).map((props) => {
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
