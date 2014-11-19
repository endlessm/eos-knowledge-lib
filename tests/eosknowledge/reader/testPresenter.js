const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const utils = imports.tests.utils;

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

const MockButton = new Lang.Class({
    Name: 'MockButton',
    Extends: GObject.Object,
    Properties: {
        'sensitive': GObject.ParamSpec.boolean('sensitive', '', '',
            GObject.ParamFlags.READWRITE, true),
    },
    Signals: {
        'clicked': {},
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
    Signals: {
        'debug-hotkey-pressed': {},
    },

    _init: function (nav_buttons) {
        this.parent();
        this.nav_buttons = nav_buttons;
        this.issue_nav_buttons = {
            back_button: new MockButton(),
            forward_button: new MockButton(),
            show: jasmine.createSpy('show'),
        };
        this.done_page = {
            get_style_context: function () { return {
                add_class: function () {},
            }; },
        };
        this.total_pages = 0;
        this._article_pages = [];
        this.page_manager = {
            add: function () {},
        };
    },

    show_all: function () {},
    append_article_page: function (page) {
        this._article_pages.push(page);
    },
    get_article_page: function (i) {
        return this._article_pages[i]
    },
    remove_all_article_pages: function () {
        this._article_pages = [];
    },
});

describe('Reader presenter', function () {
    let engine, view, buttons, construct_props, test_json,
        EXPECTED_TITLES, EXPECTED_RESULTS;
    let test_app_filename = Endless.getCurrentFileDir() + '/../../test-content/app.json';

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
            engine: engine,
            view: view,
        };
        test_json = utils.parse_object_from_path(test_app_filename);
    });

    describe('construction process', function () {
        it('works', function () {
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
        });

        it('queries the first article', function () {
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(TEST_DOMAIN,
                jasmine.objectContaining({
                    limit: 15,
                    sortBy: 'articleNumber',
                    order: 'asc',
                }), jasmine.any(Function));
        });

        it('adds the first article as a page', function () {
            spyOn(view, 'append_article_page');
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback(undefined, EXPECTED_RESULTS);
            });
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            EXPECTED_TITLES.forEach(function (title) {
                expect(view.append_article_page).toHaveBeenCalledWith(jasmine.objectContaining({
                    title: title,
                }));
            })
        });

        it('gracefully handles the query failing', function () {
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback('error', undefined);
            });
            expect(function () {
                let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            }).not.toThrow();
        });
    });

    describe('object', function () {
        let presenter;

        beforeEach(function () {
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback(undefined, EXPECTED_RESULTS);
            });
            view.total_pages = EXPECTED_TITLES.length + 1;
            presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
        });

        it('has all articles as pages', function () {
            EXPECTED_TITLES.forEach(function (title, i) {
                expect(view.get_article_page(i).title).toBe(title);
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

        it('shows the debug buttons when told to', function () {
            view.emit('debug-hotkey-pressed');
            expect(view.issue_nav_buttons.show).toHaveBeenCalled();
        });

        it('loads a subsequent issue when the debug forward button is clicked', function () {
            presenter.issue_number = 0;
            view.issue_nav_buttons.forward_button.emit('clicked');
            expect(presenter.issue_number).toBe(1);
        });

        it('loads a previous issue when the debug back button is clicked', function () {
            presenter.issue_number = 10;
            view.issue_nav_buttons.back_button.emit('clicked');
            expect(presenter.issue_number).toBe(9);
        });

        it('enables the debug back button when not on the first issue', function () {
            presenter.issue_number = 5;
            expect(view.issue_nav_buttons.back_button.sensitive).toBe(true);
        });

        it('disables the debug back button when returning to the first issue', function () {
            presenter.issue_number = 5;
            presenter.issue_number = 0;
            expect(view.issue_nav_buttons.back_button.sensitive).toBe(false);
        });

        it('returns to page zero when loading a new issue', function () {
            presenter.issue_number = 14;
            expect(view.current_page).toBe(0);
        });

        it('updates the state of the paging buttons when loading a new issue', function () {
            presenter.issue_number = 14;
            expect(buttons.forward_visible).toBe(true);
            expect(buttons.back_visible).toBe(false);
        });

        it('loads content from the appropriate issue', function () {
            engine.get_objects_by_query.calls.reset();
            presenter.issue_number = 14;
            expect(engine.get_objects_by_query).toHaveBeenCalled();
            expect(engine.get_objects_by_query.calls.argsFor(0)[1]['tag']).toBe('issueNumber14');
        });

        it('removes the old pages when loading new pages', function () {
            engine.get_objects_by_query.calls.reset();
            engine.get_objects_by_query.and.callFake(function (d, q, callback) {
                callback(undefined, [{
                    title: 'Issue 14 Title',
                    ekn_id: 'about:blank',
                }]);
            });
            spyOn(view, 'remove_all_article_pages').and.callThrough();
            presenter.issue_number = 14;
            expect(view.get_article_page(0).title).toBe('Issue 14 Title');
            expect(view.remove_all_article_pages).toHaveBeenCalled();
        });
    });
});
