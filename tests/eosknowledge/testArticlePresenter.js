const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = TESTDIR + '/test-content/cyprus.jsonld';

describe('Article Presenter', function () {
    let presenter;
    let view;
    let mockArticleData;
    let articleObject
    let engine;

    beforeEach(function () {

        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);

        let [success, data] = file.load_contents(null);
        mockArticleData = JSON.parse(data);

        articleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockArticleData);

        view = new EosKnowledge.ArticlePageA()

        engine = new EosKnowledge.Engine();

        presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
            engine: engine
        });
        presenter.load_article_from_model(articleObject);

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
