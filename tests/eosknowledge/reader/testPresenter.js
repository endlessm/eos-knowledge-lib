const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const utils = imports.tests.utils;

const TEST_DOMAIN = 'thrones-en';
const UPDATE_INTERVAL_MS = 604800000;
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const MockUserSettingsModel = new Lang.Class({
    Name: 'MockUserSettingsModel',
    Extends: GObject.Object,
    Properties: {
        'highest-article-read': GObject.ParamSpec.uint('highest-article-read', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'start-article': GObject.ParamSpec.uint('start-article', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'bookmark-page': GObject.ParamSpec.uint('bookmark-page', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'update-timestamp': GObject.ParamSpec.uint64('update-timestamp', 'Last Update Time',
            'Last time content was updated',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT64, 0),
    },
});

const MockEngine = new Lang.Class({
    Name: 'MockEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.host = 'localhost';
        this.port = 3003;
    },

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
        'lightbox-nav-previous-clicked': {},
        'lightbox-nav-next-clicked': {},
    },

    _init: function (nav_buttons) {
        this.parent();
        this.nav_buttons = nav_buttons;
        this.issue_nav_buttons = {
            back_button: new MockButton(),
            forward_button: new MockButton(),
            show: jasmine.createSpy('show'),
        };
        let get_style_context = function () {
            return {
                add_class: function () {},
            }
        }
        this.done_page = {
            get_style_context: get_style_context,
        };
        this.overview_page = {
            get_style_context: get_style_context,
            set_article_snippets: jasmine.createSpy('set_article_snippets'),
            remove_all_snippets: function () {},
        };

        this.total_pages = 0;
        this._article_pages = [];
        this.page_manager = {
            add: function () {},
        };
        this.lightbox = {};
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
    let engine, settings, view, article_nav_buttons, construct_props, test_json,
        MOCK_RESULTS;
    let test_app_filename = Endless.getCurrentFileDir() + '/../../test-content/app.json';

    beforeEach(function () {
        let MOCK_DATA = [
            [
               'Title 1',
                ["Kim Kardashian"],
                '2014/11/13 08:00',
            ],
            [
                'Title 2',
                ["Kim Kardashian"],
                '',
            ],
            [
                'Title 3',
                [],
                '2014/11/13 08:00',
            ],
            [
                'Title 4',
                [],
                '',
            ],
        ];
        MOCK_RESULTS = MOCK_DATA.map(function (data) {
            return {
                title: data[0],
                ekn_id: 'about:blank',
                get_authors: jasmine.createSpy('get_authors').and.returnValue(data[1]),
                published: data[2],
                html: '<html>hello</html>',
            }
        });
        article_nav_buttons = new MockNavButtons();
        view = new MockView(article_nav_buttons);
        engine = new MockEngine();
        settings = new MockUserSettingsModel({
            highest_article_read: 0,
            bookmark_page: 0,
            start_article: 0,
        });
        // 64-bit int construct properties don't work in GJS; they have to be
        // set after construction.
        settings.update_timestamp = GLib.MAXINT64;
        spyOn(engine, 'get_objects_by_query');
        construct_props = {
            engine: engine,
            settings: settings,
            view: view,
        };
        test_json = utils.parse_object_from_path(test_app_filename);
    });

    describe('construction process', function () {
        it('works', function () {
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
        });

        it('queries the articles in the initial article set', function () {
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    limit: 15,
                    sortBy: 'articleNumber',
                    order: 'asc',
                    tags: ['EknArticleObject'],
                    offset: 0,
                }), jasmine.any(Function));
        });

        it('adds the articles as pages', function () {
            spyOn(view, 'append_article_page');
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, MOCK_RESULTS);
            });
            let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            expect(view.append_article_page.calls.count()).toEqual(MOCK_RESULTS.length);
            MOCK_RESULTS.forEach(function (result, index) {
                expect(view.append_article_page.calls.argsFor(index)[0].title_view.title).toEqual(result.title);
            });
        });

        it('gracefully handles the query failing', function () {
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback('error', undefined);
            });
            expect(function () {
                let presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
            }).not.toThrow();
        });
    });

    describe('object', function () {
        let presenter;
        let current_time = Date.now();

        beforeEach(function () {
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, MOCK_RESULTS);
            });
            view.total_pages = MOCK_RESULTS.length + 1;
            presenter = new EosKnowledge.Reader.Presenter(test_json, construct_props);
        });

        it('has all articles as pages', function () {
            MOCK_RESULTS.forEach(function (result, i) {
                expect(view.get_article_page(i).title_view.title).toBe(result.title);
            });
        });

        it('starts on the first page', function () {
            expect(view.current_page).toBe(0);
        });

        it('disables the back button on the first page', function () {
            expect(article_nav_buttons.back_visible).toBe(false);
        });

        it('enables the forward button when not on the last page', function () {
            expect(article_nav_buttons.forward_visible).toBe(true);
        });

        it('enables the back button when not on the first page', function () {
            view.current_page = view.total_pages - 1;
            view.notify('current-page');
            expect(article_nav_buttons.back_visible).toBe(true);
        });

        it('disables the forward button on the last page', function () {
            view.current_page = view.total_pages - 1;
            view.notify('current-page');
            expect(article_nav_buttons.forward_visible).toBe(false);
        });

        it('increments the current page when clicking the forward button', function () {
            article_nav_buttons.emit('forward-clicked');
            expect(view.current_page).toBe(1);
            expect(settings.bookmark_page).toBe(1);
        });

        it('decrements the current page when clicking the back button', function () {
            article_nav_buttons.emit('forward-clicked');
            article_nav_buttons.emit('back-clicked');
            expect(view.current_page).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('shows the debug buttons when told to', function () {
            view.emit('debug-hotkey-pressed');
            expect(view.issue_nav_buttons.show).toHaveBeenCalled();
        });

        it('loads jumps to next set of articles when the debug forward button is clicked', function () {
            settings.highest_article_read = 5;
            view.issue_nav_buttons.forward_button.emit('clicked');
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(5);
        });

        it('resets content when debug back button is clicked', function () {
            settings.highest_article_read = 5;
            settings.start_article = 3;
            settings.bookmark_page = 4;
            view.issue_nav_buttons.back_button.emit('clicked');
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('updates the state of the paging buttons when loading a new set of articles', function () {
            settings.start_article = 3;
            settings.notify('start-article');
            expect(article_nav_buttons.forward_visible).toBe(true);
            expect(article_nav_buttons.back_visible).toBe(false);
        });

        it('loads content from the appropriate set of articles', function () {
            engine.get_objects_by_query.calls.reset();
            settings.start_article = 3;
            settings.notify('start-article');
            expect(engine.get_objects_by_query).toHaveBeenCalled();
            expect(engine.get_objects_by_query.calls.argsFor(0)[0]['offset']).toEqual(3);
        });

        it('removes the old pages when loading new pages', function () {
            engine.get_objects_by_query.calls.reset();
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, [MOCK_RESULTS[0]]);
            });
            spyOn(view, 'remove_all_article_pages').and.callThrough();
            settings.start_article = 3;
            settings.notify('start-article');
            expect(view.get_article_page(0).title_view.title).toBe('Title 1');
            expect(view.remove_all_article_pages).toHaveBeenCalled();
        });

        it('updates the content after enough time has passed since the last update', function () {
            settings.update_timestamp = Date.now() - UPDATE_INTERVAL_MS - 1000;
            spyOn(presenter, '_update_content');
            presenter._check_for_content_update();
            expect(presenter._update_content).toHaveBeenCalled();
        });

        it('does not update the content if very little time has passed since the last update', function () {
            settings.update_timestamp = Date.now() - (UPDATE_INTERVAL_MS / 2);
            spyOn(presenter, '_update_content');
            presenter._check_for_content_update();
            expect(presenter._update_content).not.toHaveBeenCalled();
        });

        it('has correct values after content update', function () {
            settings.highest_article_read = 5;
            presenter._update_content();
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(5);
            expect(settings.update_timestamp).toBeGreaterThan(current_time);
        });

        it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
            let model = MOCK_RESULTS[0];
            let media_object_uri = 'ekn://foo/bar';
            let media_object = {
                ekn_id: media_object_uri,
            };
            model.get_resources = function () {
                return [media_object_uri];
            };
            spyOn(presenter, '_preview_media_object');
            let lightbox_result = presenter._lightbox_handler(model, media_object);
            expect(presenter._preview_media_object).toHaveBeenCalledWith(media_object, false, false);
            expect(lightbox_result).toBe(true);

            let nonexistant_media_object = {
                ekn_id: 'ekn://no/media',
            };
            let no_lightbox_result = presenter._lightbox_handler(model, nonexistant_media_object);
            expect(no_lightbox_result).toBe(false);
        });

        describe('Attribution format', function () {
            let date_str = '2012-08-23T20:00:00';
            let localized_date_str;
            beforeEach(function () {
                let date = new Date(date_str);
                localized_date_str = date.toLocaleFormat("%B %e, %Y");
            });

            it('is blank if there is no data', function () {
                let format = presenter._format_attribution_for_metadata([], '');
                expect(format).toBe('');
            });

            it('formats one author correctly', function () {
                let format = presenter._format_attribution_for_metadata(['Kim Kardashian'], '');
                expect(format).toBe('by Kim Kardashian');
            });

            it('formats multiple authors correctly', function () {
                let format = presenter._format_attribution_for_metadata(['Kim Kardashian', "William Shakespeare"], '');
                expect(format).toBe('by Kim Kardashian and William Shakespeare');
            });

            it('formats author and date correctly', function () {
                let format = presenter._format_attribution_for_metadata(['Kim Kardashian'], date_str);
                expect(format).toBe('by Kim Kardashian on ' + localized_date_str);
            });

            it('formats date alone correctly', function () {
                let format = presenter._format_attribution_for_metadata([], date_str);
                expect(format).toBe(localized_date_str);
            });
        });

        it('sets the correct style classes on overview page snippets', function () {
            expect(presenter.view.overview_page.set_article_snippets).toHaveBeenCalledWith([
                jasmine.objectContaining({style_variant: 0}),
                jasmine.objectContaining({style_variant: 1}),
                jasmine.objectContaining({style_variant: 2}),
                jasmine.objectContaining({style_variant: 0}),
            ]);
        });
    });
});
