const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const TEST_DOMAIN = 'thrones-en';

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

const MockNavButtons = new Lang.Class({
    Name: 'MockNavButtons',
    Extends: GObject.Object,
    Properties: {
        'back-visible': GObject.ParamSpec.boolean('back-visible', '', '',
            GObject.ParamFlags.READWRITE, true),
    },
    Signals: {
        'back-clicked': {},
        'forward-clicked': {},
    },
});

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Properties: {
        'current-page': GObject.ParamSpec.uint('current-page', '', '',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0),
    },

    _init: function (nav_buttons) {
        this.parent();
        this.nav_buttons = nav_buttons;
        this.done_page = {
            get_style_context: function () { return {
                add_class: function () {},
            }; },
        };
        this.total_pages = 0;
        this.page_manager = {
            add: function () {},
        };
    },

    show_all: function () {},
    append_article_page: function () {},
    get_article_index: function () {},
    remove_all_article_pages: function () {},
});

describe('Reader presenter', function () {
    let engine, view, buttons, construct_props,
        EXPECTED_TITLES, EXPECTED_RESULTS;

    beforeEach(function () {
        EXPECTED_TITLES = ['Title 1', 'Title 2', 'Title 3'];
        EXPECTED_RESULTS = EXPECTED_TITLES.map(function (title) {
            return {
                title: title,
                ekn_id: 'about:blank',
            };
        });
        buttons = new MockNavButtons();
        view = new MockView(buttons);
        engine = new MockEngine();
        spyOn(engine, 'get_objects_by_query');
        construct_props = {
            app_file: Gio.File.new_for_path(Endless.getCurrentFileDir() + '/../../test-content/app.json'),
            engine: engine,
            view: view,
        };
    });

    describe('construction process', function () {
        it('works', function () {
            let presenter = new EosKnowledge.Reader.Presenter(construct_props);
        });

        it('queries the first article', function () {
            let presenter = new EosKnowledge.Reader.Presenter(construct_props);
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(TEST_DOMAIN,
                jasmine.objectContaining({
                    limit: 1
                }), jasmine.any(Function));
        });

        it('adds the first article as a page', function () {
            spyOn(view, 'append_article_page');
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback(undefined, [EXPECTED_RESULTS[0]]);
            });
            let presenter = new EosKnowledge.Reader.Presenter(construct_props);
            expect(view.append_article_page).toHaveBeenCalledWith(jasmine.objectContaining({
                title: EXPECTED_TITLES[0],
            }));
        });

        it('queries subsequent articles', function () {
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback(undefined, [EXPECTED_RESULTS[0]]);
            });
            let presenter = new EosKnowledge.Reader.Presenter(construct_props);
            expect(engine.get_objects_by_query.calls.count()).toBe(2);
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(TEST_DOMAIN,
                jasmine.objectContaining({ limit: 1 }), jasmine.any(Function));
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(TEST_DOMAIN,
                jasmine.any(Object), jasmine.any(Function));
        });

        it('gracefully handles the first query failing', function () {
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback('error', undefined);
            });
            expect(function () {
                let presenter = new EosKnowledge.Reader.Presenter(construct_props);
            }).not.toThrow();
        });

        it('gracefully handles the subsequent query failing', function () {
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                if(engine.get_objects_by_query.calls.count() === 1) {
                    callback(undefined, [EXPECTED_RESULTS[0]]);
                } else {
                    callback('error', undefined);
                }
            });
            expect(function () {
                let presenter = new EosKnowledge.Reader.Presenter(construct_props);
            }).not.toThrow();
        });
    });

    describe('object', function () {
        let presenter;

        beforeEach(function () {
            spyOn(view, 'append_article_page');
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                if(engine.get_objects_by_query.calls.count() === 1) {
                    callback(undefined, [EXPECTED_RESULTS[0]]);
                } else {
                    callback(undefined, EXPECTED_RESULTS);
                }
            });
            view.total_pages = EXPECTED_TITLES.length + 1;
            presenter = new EosKnowledge.Reader.Presenter(construct_props);
        });

        it('has all articles as pages', function () {
            expect(view.append_article_page.calls.count()).toBe(3);
            EXPECTED_TITLES.forEach(function (title) {
                expect(view.append_article_page).toHaveBeenCalledWith(jasmine.objectContaining({
                    title: title,
                }));
            });
        });

        it('starts on the first page', function () {
            expect(view.current_page).toBe(0);
        });

        it('disables the back button on the first page', function () {
            expect(buttons.back_visible).toBe(false);
        });

        it('enables the forward button when not on the last page', function () {
            expect(buttons.forward_visible).toBe(true);
        });

        it('enables the back button when not on the first page', function () {
            view.current_page = view.total_pages - 1;
            view.notify('current-page');
            expect(buttons.back_visible).toBe(true);
        });

        it('disables the forward button on the last page', function () {
            view.current_page = view.total_pages - 1;
            view.notify('current-page');
            expect(buttons.forward_visible).toBe(false);
        });

        it('increments the current page when clicking the forward button', function () {
            buttons.emit('forward-clicked');
            expect(view.current_page).toBe(1);
        });

        it('decrements the current page when clicking the back button', function () {
            buttons.emit('forward-clicked');
            buttons.emit('back-clicked');
            expect(view.current_page).toBe(0);
        });
    });
});
