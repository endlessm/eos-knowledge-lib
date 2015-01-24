const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const utils = imports.tests.utils;

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        let connectable_object = {
            connect: function () {},
        };
        this.section_page = connectable_object;
        this.home_page = connectable_object;
        this.categories_page = connectable_object;
        this.article_page = connectable_object;
        this.lightbox = {};
        this.history_buttons = {
            forward_button: new GObject.Object(),
            back_button: new GObject.Object(),
        };
    },

    connect: function () {},
});

const MockEngine = new Lang.Class({
    Name: 'MockEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.host = 'localhost';
        this.port = 3003;
    },

    ping: function () {},
    get_object_by_id: function () {},
    get_ekn_id: function () {},
    get_objects_by_query: function () {},
});

const MockArticlePresenter = new Lang.Class({
    Name: 'MockArticlePresenter',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
    },

    connect: function () {},
});

describe('Presenter', function () {
    let presenter;
    let data;
    let view;
    let engine;
    let article_presenter;
    let test_app_filename = Endless.getCurrentFileDir() + '/../test-content/app.json';

    beforeEach(function () {
        data = utils.parse_object_from_path(test_app_filename);

        view = new MockView();
        engine = new MockEngine();
        article_presenter = new MockArticlePresenter();
        spyOn(engine, 'ping');
        presenter = new EosKnowledge.Presenter(data, {
            article_presenter: article_presenter,
            engine: engine,
            view: view,
        });
    });

    it('can be constructed', function () {});

    it('can set title image on view from json', function () {
        expect(presenter.view.home_page.title_image_uri).toBe(data['titleImageURI']);
    });

    it('pings the knowledge engine on construction', function () {
         expect(engine.ping).toHaveBeenCalled();
    });

    it('can set cards on view from json', function () {
        expect(data['sections'].map(function (section) {
            return section['title'];
        })).toEqual(presenter.view.home_page.cards.map(function (card) {
            return card.title;
        }));
        
        expect(data['sections'].map(function (section) {
            return section['thumbnailURI'];
        })).toEqual(presenter.view.home_page.cards.map(function (card) {
            return card.thumbnail_uri;
        }));

        expect(data['sections'].map((section) => {
            return section['featured'];
        })).toEqual(presenter.view.home_page.cards.map((card) => {
            return card.featured;
        }));
    });
});
