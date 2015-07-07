const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticlePresenter = imports.app.articlePresenter;
const Engine = imports.search.engine;
const TreeNode = imports.search.treeNode;
const Utils = imports.tests.utils;
const SearchUtils = imports.search.utils;

Gtk.init(null);

const MockView = new Lang.Class({
    Name: 'MockView',
    GTypeName: 'testArticlePresenter_MockView',
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
    let toc_json = { "tableOfContents":
        [{"hasIndex": 0, "hasIndexLabel": 1, "hasLabel": "Foo", "hasContent": "#Foo"},
         {"hasIndex": 1, "hasIndexLabel": 2, "hasLabel": "Bar", "hasContent": "#Bar"},
         {"hasIndex": 2, "hasIndexLabel": 3, "hasLabel": "Baz", "hasContent": "#Baz"}]};
    let articleObject;

    beforeEach(function (done) {
        Utils.register_gresource();

        let toc = TreeNode.tree_model_from_tree_node(toc_json);
        articleObject = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn:///foo/bar',
            content_type: 'text/html',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>hi</p></body></html>'); },
            title: 'Wikihow & title',
            table_of_contents: toc,
        });
        let engine = Engine.Engine.get_default();
        spyOn(engine, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
            callback(engine);
        });
        spyOn(engine, 'get_object_by_id_finish').and.returnValue(articleObject);

        view = new MockView();
        view.connect_after('new-view-transitioned', done);

        presenter = new ArticlePresenter.ArticlePresenter({
            article_view: view,
        });
        presenter.load_article(articleObject, EosKnowledgePrivate.LoadingAnimationType.NONE);
    });

    it('can be constructed', function () {});

    it('can set title and subtitle on view', function () {
        expect(view.title).toBe(articleObject.title);
    });

    it('can set toc section list', function () {
        let labels = [];
        for (let obj of toc_json['tableOfContents']) {
            if (!('hasParent' in obj)) {
                labels.push(obj['hasLabel']);
            }
        }
        expect(view.toc.section_list).toEqual(labels);
    });
});
