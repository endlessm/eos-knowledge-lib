/* global private_imports */

const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticlePage = private_imports.articlePage;
const ArticleHTMLRenderer = private_imports.articleHTMLRenderer;
const EknWebview = private_imports.eknWebview;
const PDFView = private_imports.PDFView;
const Utils = private_imports.utils;
const WebkitURIHandlers = private_imports.webkitURIHandlers;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ArticlePresenter
 *
 * A presenter module to act as a intermediary between an <ArticleObjectModel>
 * and an <ArticlePage>. It connects to signals on the view's widgets and handles
 * those events accordingly.
 *
 * Its properties are an <article-model>, <article-view>.
 */
const ArticlePresenter = new GObject.Class({
    Name: 'ArticlePresenter',
    GTypeName: 'EknArticlePresenter',

    Properties: {
        /**
         * Property: article-model
         *
         * The <ArticleObjectModel> handled by this widget.
         */
        'article-model': GObject.ParamSpec.object('article-model', 'Article model',
            'The article object model handled by this widget',
            GObject.ParamFlags.READWRITE,
            GObject.Object.$gtype),

        /**
         * Property: article-view
         *
         * The <ArticlePage> widget created by this widget. Construct-only.
         */
        'article-view': GObject.ParamSpec.object('article-view', 'Article view',
            'The view component for this presenter',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

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
         * Event: ekn-link-clicked
         * Emitted when a ekn id link in the article page is clicked.
         * Passes the ID.
         */
        'ekn-link-clicked': {
            param_types: [
                GObject.TYPE_STRING /* MediaContentObject */,
            ]
        },
    },

    // Duration of animated scroll from section to section in the page.
    _SCROLL_DURATION: 1000,

    _init: function (props) {
        this.parent(props);

        this.article_view.toc.transition_duration = this._SCROLL_DURATION;
        this._article_model = null;
        this._webview = null;
        this._webview_load_id = 0;
        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer({
            show_title: this.template_type !== 'A',
            enable_scroll_manager: this.template_type === 'A',
        });

        this._connect_toc_widget();
        this.article_view.connect('new-view-transitioned', this._update_title_and_toc.bind(this));

        WebkitURIHandlers.register_webkit_uri_handlers(this._article_render_callback.bind(this));
    },

    set article_model (v) {
        if (this._article_model !== null && this._article_model.ekn_id === v.ekn_id)
            return;

        this._article_model = v;
        this.notify('article-model');
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

        // If we've already loaded/are already loading the page already, just return.
        if (this._article_model && this._article_model.ekn_id === model.ekn_id) {
            this.article_view.content_view_grab_focus();
            ready();
            return;
        }
        this._article_model = model;

        // Make sure we aren't currently loading anything offscreen
        this._stop_loading_views();

        if (this._article_model.html.length > 0) {
            this._webview = this._get_webview();
            this._webview_load_id = this._webview.connect('load-changed', function (view, status) {
                if (status !== WebKit2.LoadEvent.COMMITTED)
                    return;
                this._webview.disconnect(this._webview_load_id);
                this._webview_load_id = 0;
                this.article_view.switch_in_content_view(this._webview, animation_type);
                ready();
            }.bind(this));
            this._webview.load_uri(this._article_model.ekn_id);
        } else if (this._article_model.content_uri.length > 0) {
            let uri = this._article_model.content_uri;
            let file = Gio.file_new_for_uri(uri);
            let type = file.query_info('standard::content-type',
                                   Gio.FileQueryInfoFlags.NONE,
                                   null).get_content_type();
            if (type === 'application/pdf') {
                let view = this._get_pdfview_for_uri(uri);
                view.load_uri(uri);
                // FIXME: Remove this line once we support table of contents
                // widget for PDFs
                this._article_model.table_of_contents = undefined;
                this.article_view.switch_in_content_view(view, animation_type);
                ready();
            } else {
                throw new Error("We don't know how to display " + type + " articles!");
            }
        } else {
            throw new Error("Article had no body html or content uri");
        }

    },

    _article_render_callback: function (article_model) {
        return this._renderer.render(article_model);
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
            this._scroll_to_section(this.article_view.toc.target_section - 1);
        }.bind(this));

        this.article_view.toc.connect('down-clicked', function () {
            this._scroll_to_section(this.article_view.toc.target_section + 1);
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
            let label = tree.get_value(child_iter, EosKnowledgeSearch.TreeNodeColumn.LABEL);
            let indexLabel = tree.get_value(child_iter, EosKnowledgeSearch.TreeNodeColumn.INDEX_LABEL);
            let content = tree.get_value(child_iter, EosKnowledgeSearch.TreeNodeColumn.CONTENT);
            toplevel_elements.push({
                'label': label,
                'indexLabel': indexLabel,
                'content': content
            });

            success = tree.iter_next(child_iter);
        }

        return toplevel_elements;
    },

    _get_webview: function () {
        let webview = new EknWebview.EknWebview();

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

            if (baseURI === this._article_model.ekn_id) {
                // If this check is true, then we are navigating to the current
                // page or an anchor on the current page.
                decision.use();
                return false;
            } else {
                this.emit('ekn-link-clicked', baseURI);
                return true;
            }
        }.bind(this));

        return webview;
    },

    _get_pdfview_for_uri: function (uri) {
        let view = new PDFView.PDFView();
        return view;
    },
});
