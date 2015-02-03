const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = TESTDIR + '/test-content/mexico.jsonld';

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
    let webview;

    beforeEach(function (done) {
        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);

        let [success, data] = file.load_contents(null);
        mockArticleData = JSON.parse(data);

        articleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockArticleData);

        view = new MockView();
        view.connect_after('new-view-transitioned', done);

        presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
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
});
