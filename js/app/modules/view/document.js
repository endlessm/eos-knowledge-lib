// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Actions = imports.app.actions;
const ArticleContent = imports.app.interfaces.articleContent;
const Dispatcher = imports.app.dispatcher;
const EknWebview = imports.app.widgets.eknWebview;
const HistoryStore = imports.app.historyStore;
const InArticleSearch = imports.app.widgets.inArticleSearch;
const Module = imports.app.interfaces.module;
const PDFView = imports.app.widgets.PDFView;
const {spinnerReplacement} = imports.app.widgets;
const TableOfContents = imports.app.widgets.tableOfContents;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

// Make sure included for glade template
void spinnerReplacement;

const SPINNER_PAGE_NAME = 'spinner';
const CONTENT_PAGE_NAME = 'content';
const SCROLLED_PAST_PREFIX = 'scrolled-past-';

/**
 * Class: Document
 * A view of an HTML or PDF document, with scrolling
 *
 * This widget will handle toggling the <TableOfContents.collapsed> parameter
 * of the table of contents depending on available space. It provides two
 * internal frames with style classes `ViewDocument__toolbarFrame` and
 * `ViewDocument__contentFrame` for theming purposes.
 * The toolbar frame surrounds the <title> and <toc> on the right. The
 * content frame surrounds the <webview> on the left.
 */
var Document = new Module.Class({
    Name: 'View.Document',
    Extends: Endless.CustomContainer,
    Implements: [View, ArticleContent.ArticleContent],

    Properties: {
        /**
         * Property: show-titles
         *
         * Set true if the title label and top title label should be visible.
         */
        'show-titles':  GObject.ParamSpec.boolean('show-titles', 'Show Title Labels',
            'Whether to show the title label and top title label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
        /**
         * Property: show-toc
         *
         * Set true if the toc should be visible.
         */
        'show-toc':  GObject.ParamSpec.boolean('show-toc', 'Show Table of Contents',
            'Whether to show the toc',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),
        /**
         * Property: toc
         *
         * The <TableOfContents> widget created by this widget. Read-only,
         * modify using the table of contents api.
         */
        'toc': GObject.ParamSpec.object('toc', 'Table of Contents',
            'The table of contents widget to the left of the article page.',
            GObject.ParamFlags.READABLE,
            TableOfContents.TableOfContents.$gtype),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/view/document.ui',
    InternalChildren: [ 'title-label', 'top-title-label', 'toolbar-frame',
        'content-frame', 'content-grid', 'spinner', 'stack' ],
    Children: [ 'toc' ],


    COLLAPSE_TOOLBAR_WIDTH: 800,
    // The following measurements are in fractions of the whole page
    EXPANDED_LAYOUT: {
        left_margin_pct: 2 / 56,
        toolbar_pct: 14 / 56,
        toolbar_right_margin_pct: 1 / 56,
        switcher_pct: 36 / 56,
        right_margin_pct: 3 / 56
    },
    COLLAPSED_LAYOUT: {
        left_margin_pct: 0,
        toolbar_pct: 3 / 56,
        toolbar_right_margin_pct: 0,
        switcher_pct: 50 / 56,
        right_margin_pct: 3 / 56
    },
    MIN_CONTENT_WIDTH: 300,
    MIN_CONTENT_HEIGHT: 300,

    // Duration of animated scroll from section to section in the page.
    _SCROLL_DURATION: 1000,

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_title_label_from_model(this._top_title_label);

        this.show_all();

        this._setup_toc();

        if (this.show_titles) {
            this._title_label.bind_property('visible',
                this._top_title_label, 'visible',
                GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.INVERT_BOOLEAN | GObject.BindingFlags.BIDIRECTIONAL);
            this._title_label.visible = this.toc.visible;
        } else {
            this._title_label.visible = this._top_title_label.visible = false;
        }
    },

    _setup_toc: function () {
        let _toc_visible = false;
        if (this.model.table_of_contents !== undefined && this.model.content_type !== 'application/pdf') {
            this._mainArticleSections = this.model.table_of_contents
                .filter(item => !item.hasParent)
                .sort((a, b) => a.hasIndex - b.hasIndex);
            if (this._mainArticleSections.length > 1) {
                this.toc.section_list = this._mainArticleSections.map(function (section) {
                    return section.hasLabel;
                });
                _toc_visible = true;
            }
        }
        this.toc.visible = this.show_toc && _toc_visible;
        this._toolbar_frame.visible = this.toc.visible;

        this.toc.transition_duration = this._SCROLL_DURATION;

        this.toc.connect('up-clicked', function () {
            this._scroll_to_section(this.toc.target_section - 1);
        }.bind(this));

        this.toc.connect('down-clicked', function () {
            this._scroll_to_section(this.toc.target_section + 1);
        }.bind(this));

        this.toc.connect('section-clicked', function (widget, index) {
            this._scroll_to_section(index);
        }.bind(this));

    },

    load_content_promise: function () {
        return new Promise((resolve, reject) => {
            this._stack.visible_child_name = SPINNER_PAGE_NAME;
            this._spinner.active = true;
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
                    resolve();
                });

                // FIXME: Consider eventually connecting to load-failed and showing
                // an error page in the view. If we do this, make sure to hide spinner
                // when showing error page :)

                this.content_view.load_uri(this.model.ekn_id);

                /* Add nav content widget to webview */
                if (this.nav_content) {
                    this.nav_content.name = 'nav_content';
                    this.content_view.add(this.nav_content);
                    this.nav_content.show_all();
                }
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
                resolve();
            } else {
                reject(new Error("Unknown article content type: ", this.model.content_type));
            }

            this._content_grid.attach(this.content_view, 0, 1, 1, 1);
        });
    },

    set_active: function () { /* NO-OP */},

    _scroll_to_section: function (index) {
        if (this.content_view.is_loading)
            return;
        // tells the webkit webview directly to scroll to a ToC entry
        let location = this._mainArticleSections[index].hasContent;
        let script = 'scrollTo(' + location.toSource() + ', ' + this._SCROLL_DURATION + ');';
        this.toc.target_section = index;
        this.content_view.run_javascript(script, null, null);
    },

    _find_section_index: function (sectionName) {
        return this._mainArticleSections.findIndex(section =>
            section.hasContent.split('#')[1] === sectionName);
    },

    _register_share_message: function (network, message_name) {
        this._manager.connect(`script-message-received::${message_name}`, () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHARE,
                network: network
            });
        });
        this._manager.register_script_message_handler(message_name);
    },

    // Keep separate function to mock out in tests
    _create_webview: function () {
        this._manager = new WebKit2.UserContentManager ();

        /* Handle share message */
        this._register_share_message(HistoryStore.Network.FACEBOOK, 'share_on_facebook');
        this._register_share_message(HistoryStore.Network.TWITTER, 'share_on_twitter');
        this._register_share_message(HistoryStore.Network.WHATSAPP, 'share_on_whatsapp');

        return new EknWebview.EknWebview({
            expand: true,
            visible: true,
            width_request: this.MIN_CONTENT_WIDTH,
            height_request: this.MIN_CONTENT_HEIGHT,
            user_content_manager: this._manager,
        });
    },

    _get_webview: function () {
        let webview = this._create_webview();

        webview.renderer.enable_scroll_manager = true;
        webview.renderer.show_title = !this.show_toc;
        if (this.custom_css)
            webview.renderer.set_custom_css_files([this.custom_css]);

        webview.connect('notify::uri', function () {
            if (webview.uri.indexOf('#') >= 0) {
                let hash = webview.uri.split('#')[1];

                // if we scrolled past something, update the ToC
                if (hash.startsWith(SCROLLED_PAST_PREFIX)) {

                    let sectionName = hash.split(SCROLLED_PAST_PREFIX)[1];
                    let sectionIndex = this._find_section_index(sectionName);

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

            if (baseURI.startsWith(this.model.ekn_id)) {
                // If this check is true, then we are navigating to the current
                // page or an anchor on the current page. If the anchor comes
                // from the original content just scroll to it.

                if (hash && !hash.startsWith(SCROLLED_PAST_PREFIX)) {
                    let index = this._find_section_index(hash);
                    if (index !== -1)
                        this._scroll_to_section(index);
                    decision.ignore();
                } else {
                    decision.use();
                }

                return true;
            } else {
                this.emit('ekn-link-clicked', baseURI);
                decision.ignore();
                return true;
            }
        });

        return webview;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        let border_style = this._content_frame.get_style_context().get_padding(Gtk.StateFlags.NORMAL);
        let has_margins = border_style.top > 0 && border_style.bottom > 0;
        if (!this.toc.visible) {
            let margin = has_margins ? this.EXPANDED_LAYOUT.right_margin_pct * alloc.width : 0;
            let switcher_alloc = new Gdk.Rectangle({
                x: alloc.x + margin,
                y: alloc.y,
                width: alloc.width - 2 * margin,
                height: alloc.height
            });
            this._content_frame.size_allocate(switcher_alloc);
            this._toolbar_frame.set_child_visible(false);
            return;
        }
        this._toolbar_frame.set_child_visible(true);

        let collapsed_class = Utils.get_modifier_style_class('ViewDocument__toolbarFrame', 'collapsed');
        // Decide if toolbar should be collapsed
        if (this._should_collapse(alloc.width)) {
            if (!this.toc.collapsed) {
                this._toolbar_frame.get_style_context().add_class(collapsed_class);
                this.toc.collapsed = true;
                this._title_label.visible = false;
            }
        } else {
            if (this.toc.collapsed) {
                this._toolbar_frame.get_style_context().remove_class(collapsed_class);
                this.toc.collapsed = false;
            }
            // Needs to be outside the if block because _title_label could have been made invisible by
            // an article that had no toc, in which case on the next article, toc will NOT be collapsed
            // but we still need to tell _title_label to become visible
            this._title_label.visible = true;
        }

        // Allocate toolbar and article frames
        let layout = this.toc.collapsed? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
        let left_margin = layout.left_margin_pct * alloc.width;
        let toolbar_right_margin = layout.toolbar_right_margin_pct * alloc.width;
        let right_margin = layout.right_margin_pct * alloc.width;
        if (!has_margins) {
            left_margin = 0;
            toolbar_right_margin = 0;
            right_margin = 0;
        }
        let toolbar_alloc = new Gdk.Rectangle({
            x: alloc.x + left_margin,
            y: alloc.y,
            width: this._get_toolbar_width(alloc.width),
            height: alloc.height
        });
        let switcher_alloc = new Gdk.Rectangle({
            x: toolbar_alloc.x + toolbar_alloc.width + toolbar_right_margin,
            y: alloc.y,
            width: alloc.width - toolbar_alloc.width - left_margin - toolbar_right_margin - right_margin,
            height: alloc.height
        });
        this._toolbar_frame.size_allocate(toolbar_alloc);
        this._content_frame.size_allocate(switcher_alloc);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        if (!this.toc.visible) {
            return this._content_frame.get_preferred_width();
        }
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        let [switcher_min, switcher_nat] = this._content_frame.get_preferred_width();
        return [switcher_min, toolbar_nat + switcher_nat];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        if (!this.toc.visible) {
            return this._content_frame.get_preferred_height_for_width(width);
        }
        let toolbar_width = this._get_toolbar_width(width);
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_height_for_width(toolbar_width);
        let [switcher_min, switcher_nat] = this._content_frame.get_preferred_height_for_width(width - toolbar_width);
        return [Math.max(toolbar_min, switcher_min), Math.max(toolbar_nat, switcher_nat)];
    },

    _get_toolbar_width: function (total_width) {
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        // This function can be called while the window is sizing down but
        // before the toolbar collapses, so this.toc.collapsed is not a good
        // indicator of what size to request here.
        let layout = this._should_collapse(total_width) ? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
        let toolbar_width = layout.toolbar_pct * total_width;
        return Math.max(toolbar_width, toolbar_min);
    },

    _should_collapse: function (total_width) {
        return total_width <= this.COLLAPSE_TOOLBAR_WIDTH * Utils.get_text_scaling_factor();
    },
});
