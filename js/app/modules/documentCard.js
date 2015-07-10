// Copyright 2014 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const EknWebview = imports.app.eknWebview;
const Module = imports.app.interfaces.module;
const PDFView = imports.app.PDFView;
const StyleClasses = imports.app.styleClasses;
const TableOfContents = imports.app.tableOfContents;
const TreeNode = imports.search.treeNode;
const Utils = imports.app.utils;
const WebKit2 = imports.gi.WebKit2;

/**
 * Class: DocumentCard
 *
 * A card implementation for showing entire documents of content.
 *
 * This widget will handle toggling the <TableOfContents.collapsed> parameter
 * of the table of contents depending on available space. It provides two
 * internal frames with style classes
 * StyleClasses.ARTICLE_PAGE_TOOLBAR_FRAME and
 * StyleClasses.ARTICLE_PAGE_CONTENT_FRAME for theming purposes.
 * The toolbar frame surrounds the <title> and <toc> on the right. The
 * content frame surrounds the <webview> on the left.
 */
const DocumentCard = new Lang.Class({
    Name: 'DocumentCard',
    GTypeName: 'EknDocumentCard',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),

        /**
         * Property: show-top-title
         *
         * Set true if the top title label should be visible when the toc is
         * either hidden or collapsed.
         */
        'show-top-title':  GObject.ParamSpec.boolean('show-top-title', 'Show Top Title',
            'Whether to show the top title label when toc is collapsed/hidden',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
        /**
         * Property: show-toc
         *
         * Set true if the toc should be visible.
         */
        'show-toc':  GObject.ParamSpec.boolean('show-toc', 'Show Table of Contents',
            'Whether to show the toc',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
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
        /**
         * Property: content-view
         *
         * The widget created by this widget to display article content.
         * Read-only
         */
        'content-view': GObject.ParamSpec.object('content-view', 'Ekn Webview',
            'The webview used to show article content.',
            GObject.ParamFlags.READABLE,
            EknWebview.EknWebview.$gtype),
        /**
         * Property: has-margins
         *
         * Set false if the article page should zero all margins and pack
         * everything together as closely as possible. Defaults to true.
         */
        'has-margins': GObject.ParamSpec.boolean('has-margins', 'No margins',
            'Set false if the article page should zero all margins.',
            GObject.ParamFlags.READWRITE, true),
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

    Template: 'resource:///com/endlessm/knowledge/widgets/documentCard.ui',
    Children: [ 'title-label' ],
    InternalChildren: [ 'top-title-label', 'toolbar-frame', 'toolbar-grid', 'content-frame', 'content-grid' ],


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
    MIN_CONTENT_WIDTH: 400,
    MIN_CONTENT_HEIGHT: 300,

    // Duration of animated scroll from section to section in the page.
    _SCROLL_DURATION: 1000,

    _init: function (props={}) {
        // FIXME: The properties get initialized by GObject _before_ the
        // template file gets parsed and the internal children get
        // created. Since we need to refer to the internal children in
        // the setter of has_margins, we have to do this setter as a
        // separate function, rather than as a normal GObject setter.
        let has_margins = true;
        if (typeof props.has_margins !== 'undefined')
            has_margins = props.has_margins;
        delete props.has_margins;

        let content_ready_callback = props.content_ready_callback || function () {};
        delete props.content_ready_callback;

        this.parent(props);

        // Now we know the internal children have been created, we can
        // set the has_margins property.
        this.set_has_margins(has_margins);

        // We can't make gjs types through templates right now, so table of
        // contents and webview must be constructed in code
        this.toc = new TableOfContents.TableOfContents({
            visible: true,
            expand: true,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });

        this.populate_from_model();

        if (this.model.content_type === 'text/html') {

            this.content_view = this._get_webview();
            this._content_grid.add(this.content_view);

            this._webview_load_id = this.content_view.connect('load-changed', (view, status) => {
                if (status !== WebKit2.LoadEvent.COMMITTED)
                    return;
                this.content_view.disconnect(this._webview_load_id);
                this._webview_load_id = 0;
                content_ready_callback(this);
            });
            this.content_view.load_uri(this.model.ekn_id);
        } else if (this.model.content_type === 'application/pdf') {
            // FIXME: Remove this line once we support table of contents
            // widget for PDFs
            this.model.table_of_contents = undefined;
            let stream = this.model.get_content_stream();
            let content_type = this.model.content_type;
            this.content_view = new PDFView.PDFView({
                expand: true,
                width_request: this.MIN_CONTENT_WIDTH,
                height_request: this.MIN_CONTENT_HEIGHT,
            });
            this.content_view.load_stream(stream, content_type);
            this._content_grid.add(this.content_view);
            content_ready_callback(this);
        } else {
            throw new Error("Unknown article content type: ", this.model.content_type);
        }

        this.toc.transition_duration = this._SCROLL_DURATION;

        this._toolbar_grid.add(this.toc);


        this.title_label.bind_property('label',
            this._top_title_label, 'label', GObject.BindingFlags.SYNC_CREATE);
        this.title_label.bind_property('visible',
            this._top_title_label, 'visible',
            GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.INVERT_BOOLEAN | GObject.BindingFlags.BIDIRECTIONAL);
    },

    populate_from_model: function () {
        Card.Card.populate_from_model(this);

        let _toc_visible = false;
        if (this.model.table_of_contents !== undefined) {
            this._mainArticleSections = this._get_toplevel_toc_elements(this.model.table_of_contents);
            if (this._mainArticleSections.length > 1) {
                this.toc.section_list = this._mainArticleSections.map(function (section) {
                    return section.label;
                });
                _toc_visible = true;
            }
        }
        this.toc.visible = this.show_toc && _toc_visible;
    },

    _get_toplevel_toc_elements: function (tree) {
        // ToC is flat, so just get the toplevel table of contents entries
        let [success, child_iter] = tree.get_iter_first();
        let toplevel_elements = [];
        while (success) {
            let label = tree.get_value(child_iter, TreeNode.TreeNodeColumn.LABEL);
            let indexLabel = tree.get_value(child_iter, TreeNode.TreeNodeColumn.INDEX_LABEL);
            let content = tree.get_value(child_iter, TreeNode.TreeNodeColumn.CONTENT);
            toplevel_elements.push({
                'label': label,
                'indexLabel': indexLabel,
                'content': content,
            });

            success = tree.iter_next(child_iter);
        }

        return toplevel_elements;
    },

    scroll_to_section: function (index) {
        if (this.content_view.is_loading)
            return;
        // tells the webkit webview directly to scroll to a ToC entry
        let location = this._mainArticleSections[index].content;
        let script = 'scrollTo(' + location.toSource() + ', ' + this._SCROLL_DURATION + ');';
        this.toc.target_section = index;
        this.content_view.run_javascript(script, null, null);
    },

    _get_webview: function () {
        let webview = new EknWebview.EknWebview({
            expand: true,
            width_request: this.MIN_CONTENT_WIDTH,
            height_request: this.MIN_CONTENT_HEIGHT,
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

        webview.connect('decide-policy', function (webview, decision, type) {
            if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return false;

            let [baseURI, hash] = decision.request.uri.split('#');

            if (baseURI === this.model.ekn_id) {
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

    set_has_margins: function (v) {
        if (this._has_margins === v)
            return;
        if (v) {
            this._content_frame.get_style_context().remove_class(StyleClasses.NO_MARGINS);
            this._toolbar_frame.get_style_context().remove_class(StyleClasses.NO_MARGINS);
        } else {
            this._content_frame.get_style_context().add_class(StyleClasses.NO_MARGINS);
            this._toolbar_frame.get_style_context().add_class(StyleClasses.NO_MARGINS);
        }
        this._has_margins = v;
        this.notify('has-margins');
    },

    get has_margins () {
        return this._has_margins;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        if (!this.toc.visible) {
            let margin = this._has_margins ? this.EXPANDED_LAYOUT.right_margin_pct * alloc.width : 0;
            let switcher_alloc = new Cairo.RectangleInt({
                x: alloc.x + margin,
                y: alloc.y,
                width: alloc.width - 2 * margin,
                height: alloc.height
            });
            this._toolbar_frame.set_child_visible(false);
            if (this.show_top_title) {
                this._top_title_label.visible = true;
            }
            this._content_frame.size_allocate(switcher_alloc);
            return;
        }

        this._toolbar_frame.set_child_visible(true);
        // Decide if toolbar should be collapsed
        if (alloc.width < this.COLLAPSE_TOOLBAR_WIDTH) {
            if (!this.toc.collapsed) {
                this._toolbar_frame.get_style_context().add_class(StyleClasses.COLLAPSED);
                this.toc.collapsed = true;
                this.title_label.visible = false;
            }
        } else {
            if (this.toc.collapsed) {
                this._toolbar_frame.get_style_context().remove_class(StyleClasses.COLLAPSED);
                this.toc.collapsed = false;
            }
            // Needs to be outside the if block because title_label could have been made invisible by
            // an article that had no toc, in which case on the next article, toc will NOT be collapsed
            // but we still need to tell title_label to become visible
            this.title_label.visible = true;
        }

        // Allocate toolbar and article frames
        let layout = this.toc.collapsed? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
        let left_margin = layout.left_margin_pct * alloc.width;
        let toolbar_right_margin = layout.toolbar_right_margin_pct * alloc.width;
        let right_margin = layout.right_margin_pct * alloc.width;
        if (!this._has_margins) {
            left_margin = 0;
            toolbar_right_margin = 0;
            right_margin = 0;
        }
        let toolbar_alloc = new Cairo.RectangleInt({
            x: alloc.x + left_margin,
            y: alloc.y,
            width: this._get_toolbar_width(alloc.width),
            height: alloc.height
        });
        let switcher_alloc = new Cairo.RectangleInt({
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
            return this.content_view.get_preferred_width();
        }
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        let [switcher_min, switcher_nat] = this._content_frame.get_preferred_width();
        return [toolbar_min + switcher_min, toolbar_nat + switcher_nat];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        if (!this.toc.visible) {
            return this.content_view.get_preferred_height_for_width(width);
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
        let layout = total_width < this.COLLAPSE_TOOLBAR_WIDTH? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
        let toolbar_width = layout.toolbar_pct * total_width;
        return Math.max(toolbar_width, toolbar_min);
    },
});
