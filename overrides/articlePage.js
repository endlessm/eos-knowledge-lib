// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;
const Cairo = imports.gi.cairo;

const TableOfContents = imports.tableOfContents;
const WebviewSwitcherView = imports.webviewSwitcherView;

/**
 * Class: ArticlePage
 *
 * The article page of template A of the knowledge apps. Contains a title, a
 * read-only <TableOfContents> widget and a read-only <WebviewSwitcherView>
 * widget.
 *
 * The switcher will house the actual article content using a webview. Both
 * the table of contents and the switcher are created with this widget, but
 * should be modified to display the correct content using their respective
 * APIs.
 *
 * This widget will handle toggling the <TableOfContents.collapsed> parameter
 * of the table of contents depending on available space. It provides two
 * internal frames with style classes
 * EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME and
 * EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME for theming purposes.
 * The toolbar frame surrounds the <title> and <toc> on the right. The
 * switcher frame surrounds the <switcher> on the left.
 */
const ArticlePage = new Lang.Class({
    Name: 'ArticlePage',
    GTypeName: 'EknArticlePage',
    Extends: Endless.CustomContainer,
    Properties: {
        /**
         * Property: title
         *
         * A string title of the article being viewed. Defaults to the empty
         * string.
         */
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the article',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
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
         * Property: switcher
         *
         * The <WebviewSwitcherView> widget created by this widget. Read-only,
         * modify using the switcher api.
         */
        'switcher': GObject.ParamSpec.object('switcher', 'Switcher',
            'The WebviewSwitcherView widget for displaying article content.',
            GObject.ParamFlags.READABLE,
            WebviewSwitcherView.WebviewSwitcherView.$gtype),
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

    _init: function (props) {
        this._title_label = new Gtk.Label({
            wrap: true,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            expand: true,
            xalign: 0.0,
            no_show_all: true,
            visible: true
        });
        this._top_title_label = new Gtk.Label({
            hexpand: true,
            halign: Gtk.Align.CENTER,
            margin_bottom: 10,
            no_show_all: true
        });
        this._title_label.bind_property('label',
            this._top_title_label, 'label', GObject.BindingFlags.SYNC_CREATE);
        this._title_label.bind_property('visible',
            this._top_title_label, 'visible',
            GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.INVERT_BOOLEAN);
        this._toc = new TableOfContents.TableOfContents({
            expand: true,
            no_show_all: true,
            visible: true
        });
        this._switcher = new WebviewSwitcherView.WebviewSwitcherView();
        this._has_margins = true;
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(this._title_label);
        grid.add(this._toc);
        this._toolbar_frame = new Gtk.Frame();
        this._toolbar_frame.add(grid);
        this.add(this._toolbar_frame);

        let switcher_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        switcher_grid.add(this._top_title_label);
        switcher_grid.add(this._switcher);
        this._switcher_frame = new Gtk.Frame();
        this._switcher_frame.add(switcher_grid);
        this.add(this._switcher_frame);

        this.show_all();
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        let top_label_context = this._top_title_label.get_style_context();
        top_label_context.add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        top_label_context.add_class(EosKnowledge.STYLE_CLASS_COLLAPSED);
        this._toolbar_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME);
        this._switcher_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME);
    },

    set title (v) {
        if (this._title_label.label === v) return;
        this._title_label.label = v;
        this.notify('title');
    },

    get title () {
        if (this._title_label)
            return this._title_label.label;
        return '';
    },

    get toc () {
        return this._toc;
    },

    get switcher () {
        return this._switcher;
    },

    set has_margins (v) {
        if (this._has_margins === v)
            return;
        if (v) {
            this._switcher_frame.get_style_context().remove_class(EosKnowledge.STYLE_CLASS_NO_MARGINS);
            this._toolbar_frame.get_style_context().remove_class(EosKnowledge.STYLE_CLASS_NO_MARGINS);
        } else {
            this._switcher_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_MARGINS);
            this._toolbar_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_MARGINS);
        }
        this._has_margins = v;
        this.notify('has-margins');
    },

    get has_margins () {
        return this._has_margins;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        if (!this._toc.visible) {
            let margin = this._has_margins ? this.EXPANDED_LAYOUT.right_margin_pct * alloc.width : 0;
            let switcher_alloc = new Cairo.RectangleInt({
                x: alloc.x + margin,
                y: alloc.y,
                width: alloc.width - 2 * margin,
                height: alloc.height
            });
            this._switcher_frame.size_allocate(switcher_alloc);
            this._toolbar_frame.set_child_visible(false);
            return;
        }

        this._toolbar_frame.set_child_visible(true);
        // Decide if toolbar should be collapsed
        if (alloc.width < this.COLLAPSE_TOOLBAR_WIDTH) {
            if (!this._toc.collapsed) {
                this._toolbar_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_COLLAPSED);
                this._toc.collapsed = true;
                this._title_label.visible = false;
            }
        } else {
            if (this._toc.collapsed) {
                this._toolbar_frame.get_style_context().remove_class(EosKnowledge.STYLE_CLASS_COLLAPSED);
                this._toc.collapsed = false;
                this._title_label.visible = true;
            }
        }

        // Allocate toolbar and article frames
        let layout = this._toc.collapsed? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
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
        this._switcher_frame.size_allocate(switcher_alloc);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        if (!this._toc.visible) {
            return this._switcher.get_preferred_width();
        }
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        let [switcher_min, switcher_nat] = this._switcher_frame.get_preferred_width();
        return [toolbar_min + switcher_min, toolbar_nat + switcher_nat];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        if (!this._toc.visible) {
            return this._switcher.get_preferred_height_for_width(width);
        }
        let toolbar_width = this._get_toolbar_width(width);
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_height_for_width(toolbar_width);
        let [switcher_min, switcher_nat] = this._switcher_frame.get_preferred_height_for_width(width - toolbar_width);
        return [Math.max(toolbar_min, switcher_min), Math.max(toolbar_nat, switcher_nat)];
    },

    _get_toolbar_width: function (total_width) {
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        // This function can be called while the window is sizing down but
        // before the toolbar collapses, so this._toc.collapsed is not a good
        // indicator of what size to request here.
        let layout = total_width < this.COLLAPSE_TOOLBAR_WIDTH? this.COLLAPSED_LAYOUT : this.EXPANDED_LAYOUT;
        let toolbar_width = layout.toolbar_pct * total_width;
        return Math.max(Math.min(toolbar_nat, toolbar_width), toolbar_min);
    }
});
