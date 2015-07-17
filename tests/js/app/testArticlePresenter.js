const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticlePresenter = imports.app.articlePresenter;
const SearchUtils = imports.search.utils;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;


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

    switch_in_document_card: function (view, animation_type) {
        this.emit('new-view-transitioned');
    },
});

describe('Article Presenter', function () {
    let presenter;
    let view;
    let articleObject;
    let factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('document-card', Minimal.MinimalDocumentCard);

        articleObject = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn:///foo/bar',
            content_type: 'text/html',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>hi</p></body></html>'); },
            title: 'Wikihow & title',
        });

        view = new MockView();

        presenter = new ArticlePresenter.ArticlePresenter({
            article_view: view,
            factory: factory,
        });
        presenter.load_article(articleObject, EosKnowledgePrivate.LoadingAnimationType.NONE);
    });

    it('can be constructed', function () {});
});
