const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const utils = imports.tests.utils;

const TEST_DOMAIN = 'thrones-en';
const UPDATE_INTERVAL_MS = 604800000;
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const MockApplication = new Lang.Class({
    Name: 'MockApplication',
    Extends: GObject.Object,
    application_id: 'com.endlessm.EosKnowledge.Reader.testPresenter',
});

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
        'update-timestamp': GObject.ParamSpec.string('update-timestamp', 'Last Update Time',
            'Last time content was updated',
            GObject.ParamFlags.READWRITE, ''),
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

const MockSearchBox = new Lang.Class({
    Name: 'MockSearchBox',
    Extends: GObject.Object,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },
    set_menu_items: function () {},
});

let get_style_context = function () {
    return {
        add_class: function () {},
    }
};

const MockSearchResultsPage = new Lang.Class({
    Name: 'MockSearchResultsPage',
    Extends: GObject.Object,
    Signals: {
        'load-more-results': {},
    },
    clear_search_results: function () {},
    append_search_results: function () {},
    no_results_label: {
        show: function () {},
        hide: function () {},
    },
    get_style_context: get_style_context,
});

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Signals: {
        'debug-hotkey-pressed': {},
        'lightbox-nav-previous-clicked': {},
        'lightbox-nav-next-clicked': {},
    },

    _init: function (nav_buttons) {
        this.parent();
        this.nav_buttons = nav_buttons;
        this.search_box = new MockSearchBox();
        this.issue_nav_buttons = {
            back_button: new MockButton(),
            forward_button: new MockButton(),
            show: jasmine.createSpy('show'),
        };
        this.history_buttons = {
            back_button: new MockButton(),
            forward_button: new MockButton(),
            show: jasmine.createSpy('show'),
        };

        this.done_page = {
            get_style_context: get_style_context,
        };
        this.overview_page = {
            get_style_context: get_style_context,
            set_article_snippets: jasmine.createSpy('set_article_snippets'),
            remove_all_snippets: function () {},
        };
        this.standalone_page = {
            get_style_context: get_style_context,
            infobar: {
                connect: function () {},
                show: function () {},
                hide: function () {},
                get_action_area: function () { return {}; },
            },
            archive_notice: {
                show: function () {},
                hide: function () {},
            },
            article_page: {
                title_view: {},
                get_style_context: get_style_context,
            },
        };

        this.search_results_page = new MockSearchResultsPage();

        this.total_pages = 0;
        this._article_pages = [];
        this.page_manager = {
            add: function () {},
        };
        this.lightbox = {};
    },

    present_with_time: function () {},
    show_all: function () {},
    show_article_page: function () {},
    show_overview_page: function () {},
    show_done_page: function () {},
    show_global_search_standalone_page: function () {},
    show_in_app_standalone_page: function () {},
    show_search_results_page: function () {},
    append_article_page: function (page) {
        this._article_pages.push(page);
    },
    get_article_page: function (i) {
        return this._article_pages[i]
    },
    article_pages_visible: function () {
        return true;
    },
    remove_all_article_pages: function () {
        this._article_pages = [];
    },
    lock_ui: function () {},
    unlock_ui: function () {},
});

describe('Reader presenter', function () {
    let engine, settings, view, article_nav_buttons, presenter;

    const TEST_APP_FILENAME = Endless.getCurrentFileDir() + '/../../test-content/app.json';
    const TEST_JSON = utils.parse_object_from_path(TEST_APP_FILENAME);
    const MOCK_DATA = [
        ['Title 1', ['Kim Kardashian'], '2014/11/13 08:00'],
        ['Title 2', ['Kim Kardashian'], ''],
        ['Title 3', [],                 '2014/11/13 08:00'],
        ['Title 4', [],                 ''],
    ];
    const MOCK_RESULTS = MOCK_DATA.map((data, ix) => {
        let model = new EosKnowledgeSearch.ArticleObjectModel ({
            title: data[0],
            synopsis: "Some text",
            ekn_id: 'about:blank',
            published: data[2],
            html: '<html>hello</html>',
            article_number: ix,
        });
        model.authors = data[1];
        return model;
    });

    beforeEach(function () {
        let application = new MockApplication();
        article_nav_buttons = new MockNavButtons();
        view = new MockView(article_nav_buttons);
        engine = new MockEngine();
        settings = new MockUserSettingsModel({
            highest_article_read: 0,
            bookmark_page: 0,
            start_article: 0,
            update_timestamp: new Date().toISOString(),
        });
        spyOn(engine, 'get_objects_by_query');
        MOCK_RESULTS.forEach((model) =>
            spyOn(model, 'get_authors').and.returnValue(model.authors));

        presenter = new EosKnowledge.Reader.Presenter(TEST_JSON, {
            application: application,
            engine: engine,
            settings: settings,
            view: view,
        });
        spyOn(presenter, 'record_search_metric');
    });

    it('constructs', function () {});

    describe('launch process', function () {
        it('queries the articles in the initial article set', function () {
            presenter.desktop_launch();
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
                callback(undefined, MOCK_RESULTS, function () {});
            });
            presenter.desktop_launch();
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
                presenter.desktop_launch();
            }).not.toThrow();
        });

        it('loads the standalone page when launched with a search result', function () {
            const MOCK_ID = 'abc123';
            let model = new EosKnowledgeSearch.ArticleObjectModel({
                article_number: 5000,
                html: '<html>hello</html>',
                ekn_id: 'about:blank',
                title: 'I Write a Blog',
            });
            spyOn(model, 'get_authors').and.returnValue([]);
            spyOn(engine, 'get_object_by_id').and.callFake(function (id, callback) {
                callback(undefined, model);
            });
            spyOn(view, 'show_global_search_standalone_page');
            presenter.activate_search_result(0, MOCK_ID, 'fake query');
            expect(engine.get_object_by_id).toHaveBeenCalledWith(MOCK_ID,
                jasmine.any(Function));
            expect(view.show_global_search_standalone_page).toHaveBeenCalled();
        });

        it('starts at the right page when search result is in this issue', function () {
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, MOCK_RESULTS, function () {});
            });
            spyOn(engine, 'get_object_by_id').and.callFake(function (id, callback) {
                callback(undefined, MOCK_RESULTS[2]);
            });
            presenter.activate_search_result(0, 'abc2134', 'fake query');
            expect(presenter.current_page).toBe(3);
        });
    });

    describe('object', function () {
        let current_time = new Date().toISOString();

        beforeEach(function () {
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, MOCK_RESULTS, function () {});
            });
            view.total_pages = MOCK_RESULTS.length + 2;
            presenter.desktop_launch();
        });

        it('has all articles as pages', function () {
            MOCK_RESULTS.forEach(function (result, i) {
                expect(view.get_article_page(i).title_view.title).toBe(result.title);
            });
        });

        it('starts on the first page', function () {
            expect(presenter.current_page).toBe(0);
        });

        it('sets the subtitle on the view from JSON', function () {
            expect(presenter.view.overview_page.subtitle).toBe(TEST_JSON['appSubtitle']);
        });

        it('disables the back button on the first page', function () {
            expect(article_nav_buttons.back_visible).toBe(false);
        });

        it('enables the forward button when not on the last page', function () {
            expect(article_nav_buttons.forward_visible).toBe(true);
        });

        it('enables the back button when not on the first page', function () {
            presenter._go_to_page(view.total_pages - 1);
            expect(article_nav_buttons.back_visible).toBe(true);
        });

        it('increments the current page when clicking the forward button', function () {
            article_nav_buttons.emit('forward-clicked');
            expect(presenter.history_model.current_item.article_model.title).toBe("Title 1");
            expect(presenter.current_page).toBe(1);
            expect(settings.bookmark_page).toBe(1);
        });

        it('decrements the current page when clicking the back button', function () {
            article_nav_buttons.emit('forward-clicked');
            article_nav_buttons.emit('back-clicked');
            expect(presenter.current_page).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('tells the view to go to the overview page', function () {
            presenter._go_to_page(5);
            spyOn(view, 'show_overview_page');
            presenter._go_to_page(0);
            expect(view.show_overview_page).toHaveBeenCalled();
        });

        it('tells the view to go to the done page', function () {
            spyOn(view, 'show_done_page');
            presenter._go_to_page(view.total_pages - 1);
            expect(view.show_done_page).toHaveBeenCalled();
        });

        it('goes to the done page when paging forward on the last article page', function () {
            spyOn(view, 'show_done_page');
            presenter._go_to_page(view.total_pages - 2);
            article_nav_buttons.emit('forward-clicked');
            expect(view.show_done_page).toHaveBeenCalled();
        });

        it('tells the view to animate forward when going to a later page', function () {
            spyOn(view, 'show_article_page');
            presenter._go_to_page(1, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
            expect(view.show_article_page).toHaveBeenCalledWith(0, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
        });

        it('tells the view to animate backward when going to an earlier page', function () {
            presenter._go_to_page(3, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
            spyOn(view, 'show_article_page');
            presenter._go_to_page(1, EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
            expect(view.show_article_page).toHaveBeenCalledWith(0, EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
        });

        it('shows the debug buttons when told to', function () {
            view.emit('debug-hotkey-pressed');
            expect(view.issue_nav_buttons.show).toHaveBeenCalled();
        });

        it('loads jumps to next set of articles when the debug forward button is clicked', function () {
            settings.highest_article_read = 5;
            view.issue_nav_buttons.forward_button.emit('clicked');
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(0);
        });

        it('resets content when debug back button is clicked', function () {
            settings.highest_article_read = 5;
            settings.start_article = 3;
            settings.bookmark_page = 4;
            view.issue_nav_buttons.back_button.emit('clicked');
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('resets start_article counter when all content in magazine is exhausted', function () {
            engine.get_objects_by_query.and.callFake(function (q, callback) {
                callback(undefined, [], function () {});
            });
            settings.start_article = 4;
            settings.bookmark_page = 4;
            view.issue_nav_buttons.forward_button.emit('clicked');
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
                callback(undefined, [MOCK_RESULTS[0]], function () {});
            });
            spyOn(view, 'remove_all_article_pages').and.callThrough();
            settings.start_article = 3;
            settings.notify('start-article');
            expect(view.get_article_page(0).title_view.title).toBe('Title 1');
            expect(view.remove_all_article_pages).toHaveBeenCalled();
        });

        it('updates the content after enough time has passed since the last update', function () {
            let old_date = new Date(Date.now() - UPDATE_INTERVAL_MS - 1000);
            settings.update_timestamp = old_date.toISOString();
            spyOn(presenter, '_update_content');
            presenter._check_for_content_update();
            expect(presenter._update_content).toHaveBeenCalled();
        });

        it('does not update the content if very little time has passed since the last update', function () {
            let old_date = new Date(Date.now() - UPDATE_INTERVAL_MS / 2);
            settings.update_timestamp = old_date.toISOString();
            spyOn(presenter, '_update_content');
            presenter._check_for_content_update();
            expect(presenter._update_content).not.toHaveBeenCalled();
        });

        it('has correct values after content update', function () {
            settings.highest_article_read = 5;
            presenter._update_content();
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.update_timestamp).toBeGreaterThan(current_time);
        });

        it('goes to overview_page when opening magazine from standalone_page', function () {
            spyOn(view, 'show_overview_page');
            presenter._go_to_page(3);
            presenter._open_magazine();
            expect(view.show_overview_page).toHaveBeenCalled();
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

        it('issues search queries as the user types in the search box', function (done) {
            spyOn(view.search_box, 'set_menu_items');
            view.search_box.text = 'Azuc';
            view.search_box.emit('text-changed');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        q: 'Azuc',
                    }),
                    jasmine.any(Function));
                expect(view.search_box.set_menu_items).toHaveBeenCalled();
                done();
            });
        });

        it('issues a search query when user activates one in the search box', function (done) {
            spyOn(view, 'show_search_results_page');
            view.search_box.text = 'Azucar';
            view.search_box.emit('activate');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        q: 'Azucar',
                    }),
                    jasmine.any(Function));
                expect(view.show_search_results_page).toHaveBeenCalled();
                expect(presenter.history_model.current_item.query).toBe(JSON.stringify({q:'Azucar', limit: 15}));
                done();
            });
        });

        it('records a metric when searching from the search box', function (done) {
            view.search_box.text = 'Azucar';
            view.search_box.emit('activate');
            Mainloop.idle_add(function () {
                expect(presenter.record_search_metric).toHaveBeenCalled();
                done();
            });
        });

        it('issues a search query when triggered by desktop search', function (done) {
            spyOn(view, 'show_search_results_page');
            presenter.search('', 'Azucar');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        q: 'Azucar',
                    }),
                    jasmine.any(Function));
                expect(view.show_search_results_page).toHaveBeenCalled();
                expect(presenter.history_model.current_item.query).toBe(JSON.stringify({q:'Azucar', limit: 15}));
                done();
            });
        });

        it('fetches more results when the results page asks for them', function () {
            spyOn(view.search_results_page, 'append_search_results');
            presenter._get_more_results = function (num, callback) {
                callback(undefined, [MOCK_RESULTS[0]], undefined);
            }
            view.search_results_page.emit('load-more-results');
            expect(view.search_results_page.append_search_results).toHaveBeenCalled();
        });

        describe('Attribution format', function () {
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
        });

        it('sets the correct style classes on overview page snippets', function () {
            expect(presenter.view.overview_page.set_article_snippets).toHaveBeenCalledWith([
                jasmine.objectContaining({style_variant: 0}),
                jasmine.objectContaining({style_variant: 1}),
                jasmine.objectContaining({style_variant: 2}),
            ]);
        });

        it('sets the correct style variants on article titles', function () {
            expect(view.get_article_page(0).title_view.style_variant).toBe(0);
            expect(view.get_article_page(1).title_view.style_variant).toBe(1);
            expect(view.get_article_page(2).title_view.style_variant).toBe(2);
            expect(view.get_article_page(3).title_view.style_variant).toBe(0);
        });
    });
});
