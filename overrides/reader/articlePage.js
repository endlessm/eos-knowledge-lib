// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ProgressLabel = imports.reader.progressLabel;
const TitleView = imports.reader.titleView;

const _TITLE_VIEW_LEFT_MARGIN_PX = 60;
const _CONTENT_VIEW_TOP_MARGIN_PX = 40;

/**
 * Class: Reader.ArticlePage
 * The article page of the reader app.
 *
 * This page shows an article, title, attribution, and progress label.
 */
const ArticlePage = new Lang.Class({
    Name: 'ArticlePage',
    GTypeName: 'EknReaderArticlePage',
    Extends: Gtk.Frame,
    Properties: {
        /**
         * Property: title-view
         *
         * The <Reader.TitleView> widget created by this widget.
         * Read-only, modify using the title view API.
         */
        'title-view': GObject.ParamSpec.object('title-view', 'Title view',
            'The title view on the left-hand side of the page',
            GObject.ParamFlags.READABLE,
            TitleView.TitleView.$gtype),

        /**
         * Property: progress-label
         *
         * The <Reader.ProgressLabel> widget created by this widget. Read-only,
         * modify using the progress label API.
         */
        'progress-label': GObject.ParamSpec.object('progress-label', 'Progress Label',
            'The progress indicator at the top of the page',
            GObject.ParamFlags.READABLE,
            ProgressLabel.ProgressLabel.$gtype),
    },

    _init: function (props) {
        props = props || {};

        this._progress_label = new ProgressLabel.ProgressLabel({
            vexpand: false,
            valign: Gtk.Align.CENTER,
        });
        this._title_view = new TitleView.TitleView({
            expand: true,
            valign: Gtk.Align.CENTER,
            margin_left: _TITLE_VIEW_LEFT_MARGIN_PX,
        });
        this._content_view = null;
        this.parent(props);

        let separator = new Gtk.Separator({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: false,
            vexpand: true,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.FILL,
        });

        this._grid = new Gtk.Grid({
            // Keep a minimum width, or the labels get kinda illegible
            width_request: 600,
        });
        this._grid.attach(this._title_view, 0, 0, 1, 2);
        this._grid.attach(this._progress_label, 1, 0, 1, 1);
        this._grid.attach(separator, 1, 1, 1, 1);

        this.add(this._grid);

        this._size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH,
        });
        this._size_group.add_widget(this._title_view);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
    },

    get progress_label() {
        return this._progress_label;
    },

    get title_view() {
        return this._title_view;
    },

    show_content_view: function (view) {
        if (this._content_view !== null) {
            this._grid.remove(this._content_view);
            this._size_group.remove_widget(this._content_view);
        }
        view.expand = true;
        view.margin_top = _CONTENT_VIEW_TOP_MARGIN_PX;
        this._content_view = view;
        this._grid.attach(view, 2, 0, 1, 2);
        this._size_group.add_widget(view);
        view.show_all();
    },

    clear_content: function () {
        if (this._content_view !== null) {
            this._content_view.destroy();
            this._content_view = null;
        }
    },
});
