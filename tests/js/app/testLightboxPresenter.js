const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const LightboxPresenter = imports.app.lightboxPresenter;

const MockEngine = new Lang.Class({
    Name: 'MockEngine',
    GTypeName: 'MockEngine_TestLightboxPresenter',
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

    beforeEach(function () {
        engine = new MockEngine();
        view = new MockView();

        lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: engine,
            view: view,
        });
    });

    it('can be constructed', function () {});

    it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
        let media_object_uri = 'ekn://foo/bar';
        let media_object = {
            ekn_id: media_object_uri,
        };
        let article_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'Title 1',
            synopsis: 'Some text',
            ekn_id: 'about:blank',
            published: '2014/11/13 08:00',
            html: '<html>hello</html>',
            resources: [media_object_uri],
        });
        spyOn(lightbox_presenter, '_preview_media_object');
        let lightbox_result = lightbox_presenter.show_media_object(article_model, media_object);
        expect(lightbox_presenter._preview_media_object).toHaveBeenCalledWith(media_object, false, false);
        expect(lightbox_result).toBe(true);

        let nonexistant_media_object = {
            ekn_id: 'ekn://no/media',
        };
        let no_lightbox_result = lightbox_presenter.show_media_object(article_model, nonexistant_media_object);
        expect(no_lightbox_result).toBe(false);
    });
});
