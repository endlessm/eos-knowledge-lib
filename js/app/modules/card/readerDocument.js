// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const AsyncTask = imports.search.asyncTask;
const Card = imports.app.interfaces.card;
const Config = imports.app.config;
const DocumentCard = imports.app.interfaces.documentCard;
const EknWebview = imports.app.widgets.eknWebview;
const Module = imports.app.interfaces.module;
const ProgressLabel = imports.app.widgets.progressLabel;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;
const WebKit2 = imports.gi.WebKit2;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: ReaderDocument
 * A card implementation for showing full article content of a record
 *
 * This widget will has a function show_content_view, by which one
 * can add a view, e.g. a webview, to show some content for the
 * article.
 */
const ReaderDocument = new Module.Class({
    Name: 'ReaderDocumentCard',
    CssName: 'EknReaderDocumentCard',
    Extends: Gtk.Overlay,
    Implements: [Card.Card, DocumentCard.DocumentCard],

    Properties: {
        // FIXME: The following properties only make sense for reader apps.
        // StandalonePage and ReaderWindow use them, so it follows that those
        // modules also only make sense for reader apps.
        // Issue for extending such information to all models / cards:
        // https://github.com/endlessm/eos-sdk/issues/4036
        /**
         * Property: page-number
         * Page number of this page in the collection
         */
        'page-number': GObject.ParamSpec.uint('page-number', 'Page number',
            'Page number of this page in the collection',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: total-pages
         * Number of pages in this collection
         */
        'total-pages': GObject.ParamSpec.uint('total-pages', 'Total pages',
            'Number of pages in this collection',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: archived
         * Whether this article is archived
         */
        'archived': GObject.ParamSpec.boolean('archived', 'Archived',
            'Whether this article is archived',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: display-context
         * Whether to display context about the collection
         */
        'display-context': GObject.ParamSpec.boolean('display-context',
            'Display context',
            'Whether to display context about the collection',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/readerDocumentCard.ui',
    InternalChildren: [ 'title-label', 'attribution-label', 'title-view', 'ornament-frame',
        'separator', 'decorative-frame', 'content-grid' ],

    _init: function (props={}) {
        if (!(props.custom_css || props['custom-css'] || props.customCss))
            props.custom_css = 'reader.css';

        this._page_number = 0;
        this._total_pages = 0;

        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_style_variant_from_model();
        this._set_attribution_label_from_model();

        this.content_view = null;

        let decorative_title_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL,
        });

        decorative_title_size_group.add_widget(this._decorative_frame);
        decorative_title_size_group.add_widget(this._title_view);

        this._size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH,
        });
        this._size_group.add_widget(this._title_view);

        if (this.display_context) {
            this._info_notice = new ProgressLabel.ProgressLabel({
                valign: Gtk.Align.START,
                halign: Gtk.Align.CENTER,
            });
            this.add_overlay(this._info_notice);
            if (this.archived) {
                this._info_notice.label = _("This article is part of the archive.");
                this._info_notice.get_style_context().add_class(StyleClasses.READER_ARCHIVE_NOTICE_FRAME);
            } else {
                this.bind_property('page-number',
                    this._info_notice, 'current-page',
                    GObject.BindingFlags.SYNC_CREATE);
                this.bind_property('total-pages',
                    this._info_notice, 'total-pages',
                    GObject.BindingFlags.SYNC_CREATE);
            }
        }
    },

    get page_number() {
        return this._page_number;
    },

    set page_number(value) {
        if (this._page_number === value)
            return;
        this._page_number = value;
        this.notify('page-number');
    },

    get total_pages() {
        return this._total_pages;
    },

    set total_pages(value) {
        if (this._total_pages === value)
            return;
        this._total_pages = value;
        this.notify('total-pages');
    },

    _set_attribution_label_from_model: function () {
        let style = this.model.article_number % this.NUM_STYLE_VARIANTS;
        let markup_label = Utils.format_authors(this.model.authors);
        if (style === 1 || style === 2) {
            markup_label = markup_label.toLocaleUpperCase();
        }
        if (style === 1) {
            // 1362 = 1.33px * 1024 Pango units / px
            markup_label = '<span letter_spacing="1362">' + GLib.markup_escape_text(markup_label, -1) +  '</span>';
        }
        this._attribution_label.label = markup_label;
    },

    load_content: function (cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            this.content_view = this._get_webview();
            this._webview_load_id = this.content_view.connect('load-changed', (view, status) => {
                // failsafe: disconnect on load finished even if there was an error
                if (status === WebKit2.LoadEvent.FINISHED) {
                    this.content_view.disconnect(this._webview_load_id);
                    task.return_value();
                    return;
                }
            });
            let fail_id = this.content_view.connect('load-failed', (view, event, failed_uri, error) => {
                // <error> is undefined under some instances. For example, if you try to load
                // a bogus uri: http://www.sdfsdfjskkm.com
                if (error === undefined) {
                    error = new Error("WebKit failed to load this uri");
                }
                this.content_view.disconnect(fail_id);
                task.return_error(error);
            });
            this.content_view.load_uri(this.model.ekn_id);

            this._size_group.add_widget(this.content_view);
            this._content_grid.attach(this.content_view, 2, 0, 1, 2);
            this.content_view.show_all();
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
        });
    },

    _get_webview: function (article_model) {
        let webview = this._create_webview();
        if (this.custom_css)
            webview.renderer.set_custom_css_files([this.custom_css]);

        webview.connect('decide-policy', (view, decision, type)  => {
            if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return false; // default action

            let uri = decision.request.uri;
            // if this request was for the article we're trying to load,
            // proceed
            if (uri === this.model.ekn_id) {
                decision.use();
                return true;
            }
            // otherwise, if the request was for some other EKN object, fetch
            // it and attempt to display it
            this.emit('ekn-link-clicked', uri);
            // we're handling this EKN request our own way, so tell webkit
            // to back off
            decision.ignore();
            return true;
        });

        return webview;
    },
});

function get_css_for_module (css_data, num) {
    let str = "";
    let background_color = css_data['title-background-color'];
    if (typeof background_color !== 'undefined') {
        str += Utils.object_to_css_string({'background-color': background_color}, '.document-card.variant' + num + ' .decorative-bar');
        delete css_data['title-background-color'];
    }
    str += Utils.get_css_for_title_and_module(css_data,
        '.document-card.variant' + num + ' .title',
        '.document-card.variant' + num + ' .attribution');
    return str;
}
