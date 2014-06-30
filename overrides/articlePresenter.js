const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticleObjectModel = imports.articleObjectModel;
const ArticlePageA = imports.articlePageA;
const Engine = imports.engine;
const MediaObjectModel = imports.mediaObjectModel;

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
 * Its properties are an <article-model>, <article-view> and a <engine>. The engine is for
 * communication with the Knowledge Engine server.
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
            GObject.ParamFlags.READWRITE, ArticleObjectModel.ArticleObjectModel),

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

    _init: function (props) {
        this.parent(props);

        this._article_model = null;

        this._connect_toc_widget();
        this._connect_switcher_widget();
    },

    get article_model () {
        if (this._article_model !== null)
            return this._article_model;
        return null;
    },

    set article_model (v) {
        if (this._article_model !== null && this._article_model.article_content_uri === v.article_content_uri)
            return;

        // fully populate the view from a model
        this._article_model = v;

        // Set the title and toc once the switcher view has finished loading
        let id = this.article_view.switcher.connect('display-ready', function (switcher) {
            this.article_view.title = this._article_model.title;

            let _toc_visible = false;
            if (this.template_type !== 'B' && this._article_model.table_of_contents !== undefined) {
                this._mainArticleSections = this._get_toplevel_toc_elements(this._article_model.table_of_contents);
                if (this._mainArticleSections.length > 0) {
                    this.article_view.toc.section_list = this._mainArticleSections.map(function (section) {
                        return section.label;
                    });
                    this.article_view.toc.selected_section = 0;
                    _toc_visible = true;
                }
            }
            this.article_view.toc.visible = _toc_visible;
            this.notify('article-model');

            switcher.disconnect(id);
        }.bind(this));
        this.article_view.switcher.load_uri(this._article_model.article_content_uri);
    },

    _connect_switcher_widget: function () {
        this.article_view.switcher.connect('decide-navigation-policy', function (switcher, decision) {
            let [baseURI, hash] = decision.request.uri.split('#');
            let _resources = this._article_model.get_resources();
            let resourceURIs = _resources.map(function (model) {
                return model.content_uri;
            });

            // If the requested uri is just a hash, then we're
            // navigating within the current article, so don't
            // animate a new webview
            if (this._article_model.article_content_uri.indexOf(baseURI) === 0) {

                decision.use();
                return true;

            } else if (resourceURIs.indexOf(decision.request.uri) !== -1) {

                // Else, if the request corresponds to a media object in the
                // resources array, emit the bat signal!
                let media_object = _resources[resourceURIs.indexOf(decision.request.uri)];
                this.emit('media-object-clicked', media_object, true);

                decision.ignore();
                return true;

            } else {

                // Else, the request could be either for a media object
                // or a new article page
                let [domain, id] = baseURI.split('/').slice(-2);
                switcher.navigate_forwards = true;
                decision.ignore();

                this.engine.get_object_by_id(domain, id, function (err, model) {
                    if (typeof err === 'undefined') {
                        if (model instanceof MediaObjectModel.MediaObjectModel) {
                            this.emit('media-object-clicked', model, false);
                        } else {
                            this.article_model = model;
                        }
                    } else {
                        printerr(err);
                        printerr(err.stack);
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
