const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TESTDIR = Endless.getCurrentFileDir() + '/..';
// Working directory should be top of the builddir
const TESTBUILDDIR = GLib.get_current_dir() + '/tests';

function parse_object_from_path(path) {
    let file = Gio.file_new_for_uri(path);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        let connectable_object = {
            connect: function () {},
        }
        this.section_page = connectable_object;
        this.home_page = connectable_object;
        this.categories_page = connectable_object;
        this.article_page = connectable_object;
        this.lightbox = {};
        this.history_buttons = {
            forward_button: new Gtk.Button(),
            back_button: new Gtk.Button(),
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
    let test_app_filename = 'file://' + TESTDIR + '/test-content/app.json';

    beforeEach(function () {

        data = parse_object_from_path(test_app_filename);

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTBUILDDIR + '/test-content/test-content.gresource');
        resource._register();

        view = new MockView();
        engine = new MockEngine();
        article_presenter = new MockArticlePresenter();
        spyOn(engine, 'ping');
        presenter = new EosKnowledge.Presenter({
            article_presenter: article_presenter,
            domain: 'mock_domain',
            template_type: 'A',
            engine: engine,
            view: view,
        });
        presenter.set_sections(data['sections']);
    });

    it('can be constructed', function () {});

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
    });
});
