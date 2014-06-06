const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticlePageA = imports.articlePageA;
const Engine = imports.engine;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Adds javascript running after load finished to the WebKit2.Webview
 * prototype.
 */
WebKit2.WebView.prototype.run_javascript_from_gresource_after_load = function (location, cancellable, callback) {
    this.connect('load-changed', (function (v, status) {
        if(status == WebKit2.LoadEvent.FINISHED) {
            this.run_javascript_from_gresource(location, cancellable, callback);
        }
    }).bind(this));
};

/**
 * Class: ArticlePresenter
 *
 * A presenter module to act as a intermediary between an <ArticleObjectModel>
 * and an <ArticlePageA>. It connects to signals on the view's widgets and handles
 * those events accordingly.
 *
 * Its properties are an <article-view> and a <engine>. The engine is for
 * communication with the Knowledge Engine server.
 *
 * To load set the presenter up with a model, call load_article_from_model,
 * passing it a <ArticleObjectModel> object.
 */
const ArticlePresenter = new GObject.Class({
    Name: 'ArticlePresenter',
    GTypeName: 'EknArticlePresenter',

    Properties: {
        /**
         * Property: article-view
         *
         * The <ArticlePageA> widget created by this widget. Construct-only.
         */
        'article-view': GObject.ParamSpec.object('article-view', 'Article view',
            'The view component for this presenter',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ArticlePageA.ArticlePageA),

        /**
         * Property: engine
         *
         * The <Engine> widget created by this widget. Construct-only.
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine module',
            'The engine module to connect to EKN',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Engine.Engine),
    },

    _init: function (props) {
        this.parent(props);

        this._connect_toc_widget();
        this._connect_switcher_widget();
    },

    _connect_switcher_widget: function () {
        this.article_view.switcher.connect('decide-navigation-policy', function (switcher, decision) {
            let [baseURI, hash] = decision.request.uri.split('#');

            // If the requested uri is just a hash, then we're
            // navigating within the current article, so don't
            // animate a new webview
            if (this._articleModel.article_content_uri.indexOf(baseURI) === 0) {

                decision.use();
                return true;

            } else {

                // Else, a new article was requested, so load the presenter
                // with a new article and animate the switcher
                let [domain, id] = baseURI.split('/').slice(-2);
                switcher.navigate_forwards = true;
                decision.ignore();

                this.engine.get_object_by_id(domain, id, function (err, model) {
                    if (typeof err === 'undefined') {
                        this.load_article_from_model(model);
                    } else {
                        printerr("ERROR: " + err);
                    }
                }.bind(this));
                return true;

            }
        }.bind(this));

        this.article_view.switcher.connect('create-webview', function () {
            // give us a local ref to the webview for direct navigation
            this._webview = this._get_connected_webview();
            return this._webview;
        }.bind(this));
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
        // tells the webkit webview directly to scroll to a ToC entry
        let location = this._mainArticleSections[index].content.slice(1);
        let baseURI = this._webview.uri.split('#')[0];
        let selectedSectionURI = baseURI + '#scroll-to-' + location;
        this._webview.load_uri(selectedSectionURI);
    },

    load_article_from_model: function (articleModel) {
        // fully populate the view from a model
        this._articleModel = articleModel;

        // TODO: Once we are on GTK 3.12, connect to notify::transition-running
        // so that we only set the title and toc once the switcher view has
        // finished loading
        this.article_view.switcher.load_uri(articleModel.article_content_uri);

        this.article_view.title = articleModel.title;

        this._mainArticleSections = this._get_toplevel_toc_elements(articleModel.table_of_contents);
        this.article_view.toc.section_list = this._mainArticleSections.map(function (section) {
            return section.label;
        });
        this.article_view.toc.selected_section = 0;
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

    _get_connected_webview: function () {
        let webview = new WebKit2.WebView();

        webview.run_javascript_from_gresource_after_load(
                '/com/endlessm/knowledge/smooth_scroll.js', null, null);
        webview.run_javascript_from_gresource_after_load(
                '/com/endlessm/knowledge/scroll_manager.js', null, null);

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

                    if (sectionIndex !== -1)
                        this.article_view.toc.selected_section = sectionIndex;
                }
            }
        }.bind(this));

        return webview;
    }
});
