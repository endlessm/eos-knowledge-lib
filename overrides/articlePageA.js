// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const TableOfContents = imports.tableOfContents;
const WebviewSwitcherView = imports.webviewSwitcherView;

/**
 * Class: ArticlePageA
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
const ArticlePageA = new Lang.Class({
    Name: 'ArticlePageA',
    GTypeName: 'EknArticlePageA',
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
            WebviewSwitcherView.WebviewSwitcherView.$gtype)

    },

    COLLAPSE_TOOLBAR_WIDTH: 800,
    TOOLBAR_WIDTH_PERCENTAGE: .25,

    _init: function (props) {
        this._title_label = new Gtk.Label({
            wrap: true,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            expand: true,
            xalign: 0.0
        });
        this._toc = new TableOfContents.TableOfContents({
            expand: true
        });
        this._switcher = new WebviewSwitcherView.WebviewSwitcherView();
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(this._title_label);
        grid.add(this._toc);
        this._toolbar_frame = new Gtk.Frame();
        this._toolbar_frame.add(grid);
        this.add(this._toolbar_frame);

        this._switcher_frame = new Gtk.Frame();
        this._switcher_frame.add(this._switcher);
        this.add(this._switcher_frame);

        this.show_all();
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
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

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

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
        let total_width = alloc.width;
        alloc.width = this._get_toolbar_width(total_width);
        this._toolbar_frame.size_allocate(alloc);
        alloc.x += alloc.width;
        alloc.width = total_width - alloc.width;
        this._switcher_frame.size_allocate(alloc);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        let [switcher_min, switcher_nat] = this._switcher_frame.get_preferred_width();
        return [toolbar_min + switcher_min, toolbar_nat + switcher_nat];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let toolbar_width = this._get_toolbar_width(width);
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_height_for_width(toolbar_width);
        let [switcher_min, switcher_nat] = this._switcher_frame.get_preferred_height_for_width(width - toolbar_width);
        return [Math.max(toolbar_min, switcher_min), Math.max(toolbar_nat, switcher_nat)];
    },

    _get_toolbar_width: function (total_width) {
        let [toolbar_min, toolbar_nat] = this._toolbar_frame.get_preferred_width();
        return Math.max(Math.min(toolbar_nat, this.TOOLBAR_WIDTH_PERCENTAGE * total_width), toolbar_min);
    }
});
