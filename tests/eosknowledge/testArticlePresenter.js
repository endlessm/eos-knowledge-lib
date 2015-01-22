const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = TESTDIR + '/test-content/mexico.jsonld';

const MockEngine = new Lang.Class({
    Name: 'MockEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.host = 'localhost';
        this.port = 3003;
        this.language = '';
    },

    get_object_by_id: function () {},
    get_ekn_id: function () {},
    get_objects_by_query: function () {},
});

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Signals: {
        'new-view-transitioned': {}
    },

    _init: function (props) {
        this.parent(props);
        this.toc = {
            connect: function () {},
        }
    },

    switch_in_content_view: function (view, animation_type) {
        this.emit('new-view-transitioned');
    },
});

describe('Article Presenter', function () {
    let presenter;
    let view;
    let mockArticleData;
    let articleObject;
    let engine;
    let webview;

    beforeEach(function (done) {
        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);

        let [success, data] = file.load_contents(null);
        mockArticleData = JSON.parse(data);

        articleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockArticleData);

        view = new MockView();
        view.connect_after('new-view-transitioned', done);

        engine = new MockEngine();
        spyOn(engine, 'get_object_by_id');

        presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
            engine: engine
        });
        presenter.load_article(articleObject, EosKnowledge.LoadingAnimationType.NONE);
    });

    it('can be constructed', function () {});

    it('can set title and subtitle on view', function () {
        expect(view.title).toBe(articleObject.title);
    });

    it('can set toc section list', function () {
        let labels = [];
        for (let obj of mockArticleData['tableOfContents']) {
            if (!('hasParent' in obj)) {
                labels.push(obj['hasLabel']);
            }
        }
        expect(view.toc.section_list).toEqual(labels);
    });

    it('emits signal when webview navigates to media object', function (done) {
        let dummy_page = '<html><body><p>Frango frango frango</p></body></html>';
        presenter.connect('media-object-clicked', function (widget, media_object) {
            expect(media_object.ekn_id).toEqual('mock_model_id');
            done();
        }.bind());
        engine.get_object_by_id.and.callFake(function (i, callback) {
            callback(undefined, new EosKnowledgeSearch.MediaObjectModel({
                ekn_id: 'mock_model_id'
            }));
        });
        presenter._webview.load_html(dummy_page, null);
    });

    it('emits signal when webview navigates to article object', function (done) {
        let dummy_page = '<html><body><p>Frango frango frango</p></body></html>';
        presenter.connect('article-object-clicked', function (widget, article_object) {
            expect(article_object.ekn_id).toEqual('mock_model_id');
            done();
        }.bind());
        engine.get_object_by_id.and.callFake(function (i, callback) {
            callback(undefined, new EosKnowledgeSearch.ArticleObjectModel({
                ekn_id: 'mock_model_id'
            }));
        });
        presenter._webview.load_html(dummy_page, null);
    });
});
