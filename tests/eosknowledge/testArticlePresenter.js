const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;

const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = TESTDIR + '/test-content/mexico.jsonld';

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

        articleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockArticleData);

        view = new EosKnowledge.ArticlePage();
        view.connect_after('new-view-transitioned', done);

        engine = new EosKnowledge.Engine();
        engine.ping = function () {};
        engine.get_object_by_id = function () {};
        engine.get_ekn_id = function () {};
        engine.get_objects_by_query = function () {};


        presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
            engine: engine
        });
        presenter.load_article(articleObject, EosKnowledge.LoadingAnimationType.NONE);
    });

    xit('can be constructed', function () {});

    xit('can set title and subtitle on view', function () {
        expect(view.title).toBe(articleObject.title);

    });

    xit('can set toc section list', function () {
        let labels = [];
        for (let obj of mockArticleData['tableOfContents']) {
            if (!('hasParent' in obj)) {
                labels.push(obj['hasLabel']);
            }
        }
        expect(view.toc.section_list).toEqual(labels);
    });

    xit('emits signal when webview navigates to media object', function (done) {
        let redirect_page = '<html><head><meta http-equiv="refresh" content="0;url=media://my_media_url.jpg"></head><body></body></html>';
        presenter.connect('media-object-clicked', function (widget, media_object_id) {
            expect(media_object_id).toEqual('my_media_url.jpg');
            done();
        }.bind());
        webview.load_html(redirect_page, null);
    });
});
