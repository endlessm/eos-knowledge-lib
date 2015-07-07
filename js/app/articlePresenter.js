const GObject = imports.gi.GObject;
const WebKit2 = imports.gi.WebKit2;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const DocumentCard = imports.app.documentCard;
const EknWebview = imports.app.eknWebview;
const PDFView = imports.app.PDFView;
const TreeNode = imports.search.treeNode;
const WebkitContextSetup = imports.app.webkitContextSetup;

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

    _init: function (props) {
        this.parent(props);

        this._article_model = null;
        this._webview = null;
        this._webview_load_id = 0;
        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));
    },

    set article_model (v) {
        if (this._article_model !== null && this._article_model.ekn_id === v.ekn_id)
            return;

        this._article_model = v;
        this.notify('article-model');
    },

    get article_model() {
        return this._article_model;
    },

    /**
     * Function: load_article
     * Loads an <ArticleObjectModel> and adds it to the viewing history
     * Parameters:
     *   model - the <ArticleObjectModel> to be loaded
     *   animation_type - the type of <EosKnowledgePrivate.LoadingAnimation> to use
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

        if (this._article_model.content_type === 'text/html') {
            let documentCard = new DocumentCard.DocumentCard({
                model: this._article_model,
            });
            
            this._connect_toc_widget(documentCard.toc);
            documentCard.connect('ekn-link-clicked', (card, ekn_id) => {
                this.emit('ekn-link-clicked', ekn_id);
            })

            documentCard.connect('content-ready', (widget) => {
                this.article_view.switch_in_document_card(documentCard, animation_type);
                ready();
            });

        } else if (this._article_model.content_type === 'application/pdf') {
            let stream = this._article_model.get_content_stream();
            let content_type = this._article_model.content_type;
            let view = this._create_pdfview();
            view.load_stream(stream, content_type);
            // FIXME: Remove this line once we support table of contents
            // widget for PDFs
            this._article_model.table_of_contents = undefined;
            this.article_view.switch_in_document_card(view, animation_type);
            ready();
        } else {
            throw new Error("Unknown article content type: ", this._article_model.content_type);
        }

    },

    _article_render_callback: function (article_model) {
        return this._renderer.render(article_model, {
            enable_scroll_manager: this.template_type === 'A',
            show_title: this.template_type !== 'A',
        });
    },

    // Cancels any currently loading offscreen views. Right now just the
    // webviews, but if our pdf view ever supported an async load this should
    // cancel that as well.
    _stop_loading_views: function () {
        if (this._webview_load_id > 0) {
            this._webview.disconnect(this._webview_load_id);
            this._webview_load_id = 0;
            this._webview = null;
        }
    },

    _connect_toc_widget: function (toc_widget) {
        toc_widget.connect('up-clicked', function () {
            this._scroll_to_section(toc_widget, toc_widget.target_section - 1);
        }.bind(this));

        toc_widget.connect('down-clicked', function () {
            this._scroll_to_section(toc_widget, toc_widget.target_section + 1);
        }.bind(this));

        toc_widget.connect('section-clicked', function (widget, index) {
            this._scroll_to_section(toc_widget, index);
        }.bind(this));
    },

    _scroll_to_section: function (toc_widget, index) {
        if (this._webview.is_loading)
            return;
        // tells the webkit webview directly to scroll to a ToC entry
        let location = this._mainArticleSections[index].content;
        let script = 'scrollTo(' + location.toSource() + ', ' + this._SCROLL_DURATION + ');';
        toc_widget.target_section = index;
        this._webview.run_javascript(script, null, null);
    },

    _create_pdfview: function () {
        let view = new PDFView.PDFView();
        return view;
    },
});
