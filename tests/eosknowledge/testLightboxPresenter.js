const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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
        'lightbox-nav-previous-clicked': {},
        'lightbox-nav-next-clicked': {},
    },

    _init: function () {
        this.parent();
        this.lightbox = new GObject.Object();
    },
});

describe('Lightbox Presenter', function () {
    let lightbox_presenter;
    let engine;
    let view;

    const MOCK_DATA = [
        ['Title 1', ['Kim Kardashian'], '2014/11/13 08:00'],
        ['Title 2', ['Kim Kardashian'], ''],
        ['Title 3', [],                 '2014/11/13 08:00'],
        ['Title 4', [],                 ''],
    ];
    const MOCK_RESULTS = MOCK_DATA.map((data, ix) => {
        let model = new EosKnowledgeSearch.ArticleObjectModel ({
            title: data[0],
            synopsis: 'Some text',
            ekn_id: 'about:blank',
            published: data[2],
            html: '<html>hello</html>',
            article_number: ix,
        });
        model.authors = data[1];
        return model;
    });

    beforeEach(function () {
        engine = new MockEngine();
        view = new MockView();

        lightbox_presenter = new EosKnowledge.LightboxPresenter({
            engine: engine,
            view: view,
        });
    });

    it('can be constructed', function () {});

    it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
        let model = MOCK_RESULTS[0];
        let media_object_uri = 'ekn://foo/bar';
        let media_object = {
            ekn_id: media_object_uri,
        };
        model.get_resources = function () {
            return [media_object_uri];
        };
        spyOn(lightbox_presenter, '_preview_media_object');
        let lightbox_result = lightbox_presenter.show_media_object(model, media_object);
        expect(lightbox_presenter._preview_media_object).toHaveBeenCalledWith(media_object, false, false);
        expect(lightbox_result).toBe(true);

        let nonexistant_media_object = {
            ekn_id: 'ekn://no/media',
        };
        let no_lightbox_result = lightbox_presenter.show_media_object(model, nonexistant_media_object);
        expect(no_lightbox_result).toBe(false);
    });
});
