const EosKnowledge = imports.gi.EosKnowledge;
const EvinceDocument = imports.gi.EvinceDocument;
const EvinceView = imports.gi.EvinceView;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticleObjectModel = imports.articleObjectModel;
const ArticlePage = imports.articlePage;
const Engine = imports.engine;
const MediaObjectModel = imports.mediaObjectModel;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ArticlePresenter
 *
 * A presenter module to act as a intermediary between an <ArticleObjectModel>
 * and an <ArticlePage>. It connects to signals on the view's widgets and handles
 * those events accordingly.
 *
 * Its properties are an <article-model>, <article-view> and a <engine>. The engine is for
 * communication with the Knowledge Engine server.
 */
const ArticlePresenter = new GObject.Class({
    Name: 'ArticlePresenter',
    GTypeName: 'EknArticlePresenter',

    Properties: {
        /**
         * Property: history-model
         *
         * The <HistoryModel> representing the user's article viewing history.
         */
        'history-model': GObject.ParamSpec.object('history-model', 'History model',
            'The history object model handled by this widget',
            GObject.ParamFlags.READWRITE, EosKnowledge.HistoryModel),

        /**
         * Property: article-view
         *
         * The <ArticlePage> widget created by this widget. Construct-only.
         */
        'article-view': GObject.ParamSpec.object('article-view', 'Article view',
            'The view component for this presenter',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ArticlePage.ArticlePage),

        /**
         * Property: engine
         *
         * The <Engine> widget created by this widget. Construct-only.
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine module',
            'The engine module to connect to EKN',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Engine.Engine),
        /**
         * Property: template-type
         *
         * A string for the template type the window should render as
         * currently support 'A' and 'B' templates. Defaults to 'A'.
         */
        'template-type':  GObject.ParamSpec.string('template-type', 'Template Type',
            'Which template the window should display with',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, 'A'),
    },
    Signals: {
        /**
         * Event: media-object-clicked
         * Emitted when a media URI in the article page is clicked.
         * Passes the ID of the media object that was clicked and whether it is
         * a resource of the parent article model.
         */
        'media-object-clicked': {
            param_types: [
                GObject.TYPE_OBJECT /* MediaContentObject */,
                GObject.TYPE_BOOLEAN /* Whether the media object is internal */
            ]
        }
    },

    // Duration of animated scroll from section to section in the page.
    _SCROLL_DURATION: 1000,

    _init: function (props) {
        this._history_model = null;

        this.parent(props);

        this.article_view.toc.transition_duration = this._SCROLL_DURATION;
        this._article_model = null;
        this._webview = null;
        this._webview_load_id = 0;
        this._offscreen_window = new Gtk.OffscreenWindow();

        this._connect_toc_widget();
        this.article_view.connect('new-view-transitioned', this._update_title_and_toc.bind(this));
    },

    get history_model () {
        return this._history_model;
    },

    set history_model (v) {
        if (this._history_model === v)
            return;
        this._history_model = v;
        this.notify('history-model');
    },

    /**
     * Function: load_article
     * Loads an <ArticleObjectModel> and adds it to the viewing history
     * Parameters:
     *   model - the <ArticleObjectModel> to be loaded
     *   animation_type - the type of <EosKnowledge.LoadingAnimation> to use
     *   ready - optional, a function to call when the view is ready for display
     */
    load_article: function (model, animation_type, ready) {
        if (ready === undefined)
            ready = function () {};

        // Only add new item to history model if either there is no current item at all
        // or if the current item is different (has a different URI) from the new item
        if (this._history_model &&
            (this._history_model.current_item === null ||
            this._history_model.current_item.article_model.ekn_id !== model.ekn_id)) {
            this._history_model.current_item = new ArticleHistoryItem({
                title: model.title,
                article_model: model
            });
        }

        // If we've already loaded/are already loading the page already, just return.
        if (this._article_model && this._article_model.ekn_id === model.ekn_id) {
            ready();
            return;
        }
        this._article_model = model;

        // Make sure we aren't currently loading anything offscreen
        this._stop_loading_views();

        // If the article model has no content_uri, assume html and load the ekn_id uri
        let uri = this._article_model.ekn_id;
        let type = 'text/html';
        if (this._article_model.content_uri.length > 0) {
            uri = this._article_model.content_uri;
            let file = Gio.file_new_for_uri(uri);
            type = file.query_info('standard::content-type',
                                   Gio.FileQueryInfoFlags.NONE,
                                   null).get_content_type();
        }

        if (type === 'text/html') {
            this._webview = this._get_webview_for_uri(uri);
            this._webview_load_id = this._webview.connect('load-changed', function (view, status) {
                if (status !== WebKit2.LoadEvent.COMMITTED)
                    return;
                this._webview.disconnect(this._webview_load_id);
                this._webview_load_id = 0;
                this.article_view.switch_in_content_view(this._webview, animation_type);
                ready();
            }.bind(this));
        } else if (type === 'application/pdf') {
            let view = this._get_pdfview_for_uri(uri);
            this.article_view.switch_in_content_view(view, animation_type);
            ready();
        } else {
            throw new Error("We don't know how to display " + type + " articles!");
        }
    },

    // Cancels any currently loading offscreen views. Right now just the
    // webviews, but if our pdf view ever supported an async load this should
    // cancel that as well.
    _stop_loading_views: function () {
        if (this._webview_load_id > 0) {
            this._webview.disconnect(this._webview_load_id);
            this._webview_load_id = 0;
            this._webview.destroy();
            this._webview = null;
        }
    },

    /**
     * Function: navigate_back
     * Loads the previously viewed <ArticleObjectModel> with a 'navigate
     * backwards' animation.
     */
    navigate_back: function () {
        this._history_model.go_back();
        this.load_article(this._history_model.current_item.article_model, EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
    },

    /**
     * Function: navigate_forward
     * Loads the <ArticleObjectModel> viewed after the current one with a
     * 'navigate forwards' animation.
     */
    navigate_forward: function () {
        this._history_model.go_forward();
        this.load_article(this._history_model.current_item.article_model, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
    },

    _update_title_and_toc: function () {
        this.article_view.title = this._article_model.title;

        let _toc_visible = false;
        if (this.template_type !== 'B' && this._article_model.table_of_contents !== undefined) {
            this._mainArticleSections = this._get_toplevel_toc_elements(this._article_model.table_of_contents);
            if (this._mainArticleSections.length > 1) {
                this.article_view.toc.section_list = this._mainArticleSections.map(function (section) {
                    return section.label;
                });
                _toc_visible = true;
            }
        }
        this.article_view.toc.visible = _toc_visible;
    },

    _connect_toc_widget: function () {
        this.article_view.toc.connect('up-clicked', function () {
            this._scroll_to_section(this.article_view.toc.selected_section - 1);
        }.bind(this));

        this.article_view.toc.connect('down-clicked', function () {
            this._scroll_to_section(this.article_view.toc.selected_section + 1);
        }.bind(this));

        this.article_view.toc.connect('section-clicked', function (widget, index) {
            this._scroll_to_section(index);
        }.bind(this));
    },

    _scroll_to_section: function (index) {
        if (this._webview.is_loading)
            return;
        // tells the webkit webview directly to scroll to a ToC entry
        let location = this._mainArticleSections[index].content;
        let script = 'scrollTo(' + location.toSource() + ', ' + this._SCROLL_DURATION + ');';
        this.article_view.toc.target_section = index;
        this._webview.run_javascript(script, null, null);
    },

    _get_toplevel_toc_elements: function (tree) {
        // ToC is flat, so just get the toplevel table of contents entries
        let [success, child_iter] = tree.get_iter_first();
        let toplevel_elements = [];
        while (success) {
            let label = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.LABEL);
            let indexLabel = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.INDEX_LABEL);
            let content = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.CONTENT);
            toplevel_elements.push({
                'label': label,
                'indexLabel': indexLabel,
                'content': content
            });

            success = tree.iter_next(child_iter);
        }

        return toplevel_elements;
    },

    _get_webview_for_uri: function (uri) {
        let webview = new EosKnowledge.EknWebview();

        webview.inject_js_from_resource('resource:///com/endlessm/knowledge/scroll_manager.js');
        if (this.template_type === 'A')
            webview.inject_css_from_resource('resource:///com/endlessm/knowledge/hide_title.css');

        webview.connect('notify::uri', function () {
            if (webview.uri.indexOf('#') >= 0) {
                let hash = webview.uri.split('#')[1];

                // if we scrolled past something, update the ToC
                if(hash.indexOf('scrolled-past-') === 0) {

                    let sectionName = hash.split('scrolled-past-')[1];
                    let sectionIndex = -1;
                    // Find the index corresponding to this section
                    for (let index in this._mainArticleSections) {
                        let thisName = this._mainArticleSections[index].content.split("#")[1];
                        if (thisName === sectionName)
                            sectionIndex = index;
                    }

                    if (sectionIndex !== -1 &&
                        this.article_view.toc.target_section === this.article_view.toc.selected_section) {
                        this.article_view.toc.transition_duration = 0;
                        this.article_view.toc.target_section = sectionIndex;
                        this.article_view.toc.transition_duration = this._SCROLL_DURATION;
                    }
                }
            }
        }.bind(this));

        webview.connect('decide-policy', function (webview, decision, type) {
            if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return false;

            let [baseURI, hash] = decision.request.uri.split('#');
            let _resources = this._article_model.get_resources();
            let resource_ekn_ids = _resources.map(function (model) {
                return model.ekn_id;
            });

            // If this check is true, then the base of the requested URI
            // was equal to that of the article model and so we should just
            // follow it. This handles the case where we are navigating to
            // an article for the first time from the section page, or we
            // are navigating to a hash within the current article.
            if (this._article_model.ekn_id.indexOf(baseURI) === 0) {
                decision.use();
                return false;
            } else if (resource_ekn_ids.indexOf(decision.request.uri) !== -1) {
                // Else, if the request corresponds to a media object in the
                // resources array, emit the bat signal!
                let lightbox = _resources.filter(function (resource) {
                    return decision.request.uri === resource.ekn_id;
                });
                this.emit('media-object-clicked', lightbox[0], true);

                decision.ignore();
                return true;
            } else {
                // Else, the request could be either for a media object
                // or a new article page
                let [domain, id] = baseURI.split('/').slice(-2);
                decision.ignore();

                this.engine.get_object_by_id(domain, id, function (err, model) {
                    if (typeof err === 'undefined') {
                        if (model instanceof MediaObjectModel.MediaObjectModel) {
                            this.emit('media-object-clicked', model, false);
                        } else {
                            this.load_article(model, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
                        }
                    } else {
                        printerr(err);
                        printerr(err.stack);
                    }
                }.bind(this));
                return true;
            }
        }.bind(this));

        this._offscreen_window.add(webview);
        this._offscreen_window.show_all();
        webview.load_uri(uri);
        return webview;
    },

    _get_pdfview_for_uri: function (uri) {
        let evince_document = EvinceDocument.Document.factory_get_document(
            this._article_model.content_uri,
            EvinceDocument.DocumentLoadFlags.NONE, null);
        let document_model = new EvinceView.DocumentModel({
            document: evince_document
        });
        let view = new EvinceView.View();
        view.set_model(document_model);
        let scroll_window = new Gtk.ScrolledWindow();
        scroll_window.add(view);
        return scroll_window;
    },
});

const ArticleHistoryItem = new Lang.Class({
    Name: 'ArticleHistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledge.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        'article-model': GObject.ParamSpec.object('article-model', 'Article model',
            'The article object model handled by this widget',
            GObject.ParamFlags.READWRITE, ArticleObjectModel.ArticleObjectModel),
    }
});
