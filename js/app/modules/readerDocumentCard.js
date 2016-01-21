// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const AsyncTask = imports.search.asyncTask;
const Card = imports.app.interfaces.card;
const DocumentCard = imports.app.interfaces.documentCard;
const EknWebview = imports.app.widgets.eknWebview;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;
const WebKit2 = imports.gi.WebKit2;

const _PROGRESS_LABEL_MARGIN = 20;
const _DECORATIVE_BAR_HEIGHT = 19;
const _COMPOSITE_SEPARATOR_MARGIN_PX = 10;
const _COMPOSITE_TITLE_VIEW_LEFT_MARGIN_PX = 40;

/**
 * Class: ReaderDocumentCard
 * A card implementation for showing full article content of a record
 *
 * This widget will has a function show_content_view, by which one
 * can add a view, e.g. a webview, to show some content for the
 * article.
 */
const ReaderDocumentCard = new Lang.Class({
    Name: 'ReaderDocumentCard',
    GTypeName: 'EknReaderDocumentCard',
    Extends: Gtk.Overlay,
    Implements: [ Module.Module, Card.Card, DocumentCard.DocumentCard ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'content-view': GObject.ParamSpec.override('content-view', DocumentCard.DocumentCard),
        'custom-css': GObject.ParamSpec.override('custom-css',
            DocumentCard.DocumentCard),
        /**
         * Property: info-notice
         *
         * A widget showing info about the cards position in the app, overlaid
         * over card contents.
         */
        'info-notice': GObject.ParamSpec.object('info-notice', 'Progress Label',
            'The progress indicator at the top of the page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Widget),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/readerDocumentCard.ui',
    InternalChildren: [ 'title-label', 'attribution-label', 'title-view', 'ornament-frame',
        'separator', 'decorative-frame', 'content-grid' ],

    _init: function (props={}) {
        if (!(props.custom_css || props['custom-css'] || props.customCss))
            props.custom_css = 'reader.css';

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

        if (this.info_notice) {
            this.info_notice.valign = Gtk.Align.START;
            this.info_notice.halign = Gtk.Align.CENTER;
            this.info_notice.margin_top = _PROGRESS_LABEL_MARGIN + _DECORATIVE_BAR_HEIGHT;
            this.add_overlay(this.info_notice);
        }

        if (Endless.is_composite_tv_screen(null)) {
            this._title_view.margin_start = _COMPOSITE_TITLE_VIEW_LEFT_MARGIN_PX;
            this._separator.margin_start = _COMPOSITE_SEPARATOR_MARGIN_PX;
            this._separator.margin_end = _COMPOSITE_SEPARATOR_MARGIN_PX;
        }
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
