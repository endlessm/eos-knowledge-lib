const GObject = imports.gi.GObject;
const EosKnowledge = imports.gi.EosKnowledge;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticlePresenter = new GObject.Class({
    Name: 'ArticlePresenter',
    GTypeName: 'EknArticlePresenter',

    _init: function (articleView, engine) {
        this.parent();

        if (typeof engine !== 'undefined') {
            this.engine = engine;
        } else {
            this.engine = EosKnowledge.Engine;
        }

        this._articleView = articleView;

        this._connectify_toc_widget();
        this._connectify_switcher_widget();
    },

    _connectify_switcher_widget: function () {
        this._articleView.switcher.connect('decide-navigation-policy', function (switcher, decision) {
            let [baseURI, hash] = decision.request.uri.split("#");

            // If the requested uri is just a hash, then we're 
            // navigating within the current article, so don't
            // animate a new webview
            if (this._articleModel.article_content_uri.indexOf(baseURI) === 0) {
                decision.use();
                return true;
            } else {
            // Else, a new article was requested, so animate for the 
            // new article model
                let [domain, id] = baseURI.split('/').slice(-2);
                switcher.navigate_forwards = true;
                decision.ignore();
                this.engine.get_object_by_id(domain, id, function (err, model) {
                    this.load_article_from_model(model);
                }.bind(this));
                return true;
            }
        }.bind(this));

        this._articleView.switcher.connect('create-webview', function () {
            // give us a local ref to the webview for direct navigation
            this._webview = this._get_connectified_webview();
            return this._webview;
        }.bind(this));
    },

    _connectify_toc_widget: function () {
        this._articleView.toc.connect('up-clicked', function () {
            this._scroll_to_section(this._articleView.toc.selected_section - 1);
        }.bind(this));

        this._articleView.toc.connect('down-clicked', function () {
            this._scroll_to_section(this._articleView.toc.selected_section + 1);
        }.bind(this));

        this._articleView.toc.connect('section-clicked', function (widget, index) {
            this._scroll_to_section(index);
        }.bind(this));
    },

    _scroll_to_section: function (index) {
        // tells the webkit webview directly to scroll to a ToC entry
        let hash = this._mainArticleSections[index].content.slice(1);
        let baseURI = this._webview.uri.split("#")[0];
        let selectedSectionURI = baseURI + "#scroll-to-" + hash;
        this._webview.load_uri(selectedSectionURI);
    },

    load_article_from_model: function (articleModel) {
        // fully populate the view from a model
        this._articleModel = articleModel;
        this._mainArticleSections = this._get_toplevel_toc_elements(articleModel.table_of_contents);

        this._articleView.title = articleModel.title;
        this._articleView.toc.section_list = this._mainArticleSections.map(function (section) {
            return section.label;
        });

        this._articleView.switcher.load_uri(articleModel.article_content_uri);
        this._articleView.toc.selected_section = 0;
    },

    _get_toplevel_toc_elements: function (tree) {
        // ToC is flat, so just get the toplevel table of contents entries
        let [success, child_iter] = tree.get_iter_first();
        let toplevel_elements = [];
        let index = 0;

        while (success) {
            let label = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.LABEL);
            let indexLabel = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.INDEX_LABEL);
            let content = tree.get_value(child_iter, EosKnowledge.TreeNodeColumn.CONTENT);

            toplevel_elements[index] = {
                "label": label,
                "indexLabel": indexLabel,
                "content": content
            };

            index++;
            success = tree.iter_next(child_iter);
        }

        return toplevel_elements;
    },

    _get_connectified_webview: function () {
        let webview = new WebKit2.WebView();

        // when the webview has finished loading the dom, load the js
        webview.connect('load-changed', function (v, status) {
            if(status == WebKit2.LoadEvent.FINISHED) {
                webview.run_javascript_from_gresource('/com/endlessm/knowledge/smooth_scroll.js', null, function () {
                    webview.run_javascript_from_gresource('/com/endlessm/knowledge/scroll_manager.js', null, null);
                });
            }
        });

        webview.connect('notify::uri', function () {
            if (webview.uri.indexOf('#') >= 0) {
                var hash = webview.uri.split('#')[1];

                // if we scrolled past something, update the ToC
                if(hash.indexOf('scrolled-past-') === 0) {
                    let sectionName = hash.split('scrolled-past-')[1];
                    let sectionIndex = -1;
                    for (let index in this._mainArticleSections) {
                        let thisName = this._mainArticleSections[index].content.split("#")[1]; 
                        if (thisName === sectionName)
                            sectionIndex = index;
                    }
                    this._articleView.toc.selected_section = sectionIndex;
                }
            }
        }.bind(this));

        return webview;
    }
});
