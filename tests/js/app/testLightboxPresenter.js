const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const MediaObjectModel = imports.search.mediaObjectModel;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const LightboxPresenter = imports.app.lightboxPresenter;

const MockView = new Lang.Class({
    Name: 'MockView',
    GTypeName: 'MockView_TestLightboxPresenter',
    Extends: GObject.Object,
    Signals: {
        'lightbox-nav-previous-clicked': {},
        'lightbox-nav-next-clicked': {},
    },

    _init: function () {
        this.parent();
        this.lightbox = new GObject.Object();
    },
});

Gtk.init(null);

describe('Lightbox Presenter', function () {
    let lightbox_presenter;
    let engine;
    let view;
    let factory;

    beforeEach(function () {
        engine = new MockEngine.MockEngine();
        view = new MockView();
        factory = new MockFactory.MockFactory();

        lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: engine,
            view: view,
            factory: factory,
        });
    });

    it('can be constructed', function () {});

    it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
        let media_object_uri = 'ekn://foo/bar';
        let media_object = new MediaObjectModel.MediaObjectModel({
            ekn_id: media_object_uri,
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });
        let article_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'Title 1',
            synopsis: 'Some text',
            ekn_id: 'about:blank',
            published: '2014/11/13 08:00',
            resources: [media_object_uri],
        });
        let lightbox_result = lightbox_presenter.show_media_object(article_model, media_object);
        expect(lightbox_result).toBe(true);

        let nonexistant_media_object = new MediaObjectModel.MediaObjectModel({
            ekn_id: 'ekn://no/media',
        });
        let no_lightbox_result = lightbox_presenter.show_media_object(article_model, nonexistant_media_object);
        expect(no_lightbox_result).toBe(false);
    });
});
