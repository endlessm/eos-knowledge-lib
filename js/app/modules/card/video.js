// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const AsyncTask = imports.search.asyncTask;
const Card = imports.app.interfaces.card;
const DocumentCard = imports.app.interfaces.documentCard;
const EknWebview = imports.app.widgets.eknWebview;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const PDFView = imports.app.widgets.PDFView;
// Make sure included for glade template
const Utils = imports.app.utils;

const SPINNER_PAGE_NAME = 'spinner';
const CONTENT_PAGE_NAME = 'content';

/**
 * Class: KnowledgeDocument
 *
 * A card implementation for showing entire documents of content.
 *
 * This widget will handle toggling the <TableOfContents.collapsed> parameter
 * of the table of contents depending on available space. It provides two
 * internal frames with style classes
 * 'CardKnowledgeDocument__toolbarFrame' and
 * 'CardKnowledgeDocument__contentFrame' for theming purposes.
 * The toolbar frame surrounds the <title> and <toc> on the right. The
 * content frame surrounds the <webview> on the left.
 */
const KnowledgeDocument = new Module.Class({
    Name: 'Card.Video',
    Extends: Gtk.Grid,
    Implements: [Card.Card, DocumentCard.DocumentCard],

    Properties: {
        /**
         * Property: show-titles
         *
         * Set true if the title label should be visible.
         */
        'show-title':  GObject.ParamSpec.boolean('show-title', 'Show Title Label',
            'Whether to show the title label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/video.ui',
    InternalChildren: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_synopsis_label_from_model(this._synopsis_label);

        this.show_all();

        this._title_label.visible = this.show_title;
    },

    load_content: function (cancellable, callback) {
        this._stack.visible_child_name = SPINNER_PAGE_NAME;
        this._spinner.active = true;
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            if (this.model.content_type === 'text/html') {
                this.content_view = this._get_webview();

                let article_search = new InArticleSearch.InArticleSearch(this.content_view);
                let history = HistoryStore.get_default();
                let action = history.lookup_action('article-search-visible');
                article_search.search_mode_enabled = action.state.unpack();
                this._content_grid.attach(article_search, 0, 2, 1, 1);

                history.connect('action-state-changed::article-search-visible', (history, name, value) => {
                    article_search.search_mode_enabled = value.unpack();
                });
                article_search.connect('notify::search-mode-enabled', () => {
                    let state = action.state.unpack();
                    if (article_search.search_mode_enabled != state)
                        action.change_state(new GLib.Variant('b',
                            article_search.search_mode_enabled));
                });

                this._webview_load_id = this.content_view.connect('load-changed', (view, status) => {
                    if (status !== WebKit2.LoadEvent.COMMITTED)
                        return;
                    this._stack.visible_child_name = CONTENT_PAGE_NAME;
                    this._spinner.active = false;
                    this.content_view.disconnect(this._webview_load_id);
                    this._webview_load_id = 0;
                    task.return_value();
                });

                // FIXME: Consider eventually connecting to load-failed and showing
                // an error page in the view. If we do this, make sure to hide spinner
                // when showing error page :)

                this.content_view.load_uri(this.model.ekn_id);
            } else if (this.model.content_type === 'application/pdf') {
                let stream = this.model.get_content_stream();
                let content_type = this.model.content_type;
                this.content_view = new PDFView.PDFView({
                    expand: true,
                    width_request: this.MIN_CONTENT_WIDTH,
                    height_request: this.MIN_CONTENT_HEIGHT,
                    visible: true,
                });
                this.content_view.load_stream(stream, content_type);
                this._stack.visible_child_name = CONTENT_PAGE_NAME;
                this._spinner.active = false;
                task.return_value();
            } else {
                throw new Error("Unknown article content type: ", this.model.content_type);
            }

            this._panel_overlay.add(this.content_view);
        });
    },

    load_content_finish: function (task) {
        return task.finish();
    },

    clear_content: function () {
        this.content_view.destroy();
        this.content_view = null;
    },

    // Keep separate function to mock out in tests
    _create_webview: function () {
        return new EknWebview.EknWebview({
            expand: true,
            visible: true,
            width_request: this.MIN_CONTENT_WIDTH,
            height_request: this.MIN_CONTENT_HEIGHT,
        });
    },

    _get_webview: function () {
        let webview = this._create_webview();

        webview.renderer.enable_scroll_manager = this.show_toc;
        webview.renderer.show_title = !this.show_toc;
        if (this.custom_css)
            webview.renderer.set_custom_css_files([this.custom_css]);

        // If we ever want previous/next cards to work with PDFs we'll need to
        // generalize the show panel logic here.
        let exited_top_area = false;
        Gio.DBus.session.signal_subscribe(null,
                                          'com.endlessm.Knowledge.WebviewScroll',
                                          null,
                                          Utils.dbus_object_path_for_webview(webview),
                                          null,
                                          0,
                                          (connection, sender, path, name, signal, variant) => {
            let [scroll_height, scroll_height_max] = variant.deep_unpack();
            let in_top_area = scroll_height < 25;
            let in_bottom_area = (scroll_height_max - scroll_height) < 25;
            if (this._previous_panel)
                this._previous_panel.reveal_panel = exited_top_area && in_top_area;
            if (this._next_panel)
                this._next_panel.reveal_panel = in_bottom_area;
            if (!in_top_area)
                exited_top_area = true;
        });

        webview.connect('notify::uri', function () {
            if (webview.uri.indexOf('#') >= 0) {
                let hash = webview.uri.split('#')[1];

                // if we scrolled past something, update the ToC
                if (hash.indexOf('scrolled-past-') === 0) {

                    let sectionName = hash.split('scrolled-past-')[1];
                    let sectionIndex = -1;
                    // Find the index corresponding to this section
                    for (let index in this._mainArticleSections) {
                        let thisName = this._mainArticleSections[index].content.split("#")[1];
                        if (thisName === sectionName)
                            sectionIndex = index;
                    }

                    if (sectionIndex !== -1 &&
                        this.toc.target_section === this.toc.selected_section) {
                        this.toc.transition_duration = 0;
                        this.toc.target_section = sectionIndex;
                        this.toc.transition_duration = this._SCROLL_DURATION;
                    }
                }
            }
        }.bind(this));

        webview.connect('decide-policy', (webview, decision, type) => {
            if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return false;

            let [baseURI, hash] = decision.request.uri.split('#');

            if (baseURI === this.model.ekn_id) {
                // If this check is true, then we are navigating to the current
                // page or an anchor on the current page.
                decision.use();
                return true;
            } else {
                this.emit('ekn-link-clicked', baseURI);
                return true;
            }
        });

        return webview;
    },
});
