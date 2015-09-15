const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const MediaObjectModel = imports.search.mediaObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockLightbox = imports.tests.mockLightbox;
const LightboxPresenter = imports.app.lightboxPresenter;

Gtk.init(null);

describe('Lightbox Presenter', function () {
    let lightbox_presenter, engine, lightbox, factory, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();

        engine = new MockEngine.MockEngine();
        lightbox = new MockLightbox.MockLightbox();
        factory = new MockFactory.MockFactory();

        lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: engine,
            lightbox: lightbox,
            factory: factory,
        });
        factory.add_named_mock('lightbox-card', Minimal.MinimalCard);
    });

    it('can be constructed', function () {});

    it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
        let media_object_uri = 'ekn://foo/bar';
        let media_object = new MediaObjectModel.MediaObjectModel({
            ekn_id: media_object_uri,
        });
        let article_model = new ArticleObjectModel.ArticleObjectModel({
            resources: [media_object_uri],
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: article_model,
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_MEDIA,
            model: media_object,
        });
        expect(factory.get_created_named_mocks('lightbox-card').length).toBe(1);

        let nonexistant_media_object = new MediaObjectModel.MediaObjectModel({
            ekn_id: 'ekn://no/media',
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_MEDIA,
            model: nonexistant_media_object,
        });
        expect(factory.get_created_named_mocks('lightbox-card').length).toBe(1);
    });
});
