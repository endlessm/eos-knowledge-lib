// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const ProgressLabel = imports.app.reader.progressLabel;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Reader.DonePage
 * Page shown in the reader when there are no more articles
 *
 * This page displays a message indicating that the user should come back later
 * to find new articles.
 *
 * CSS classes:
 *   done-page - on the page itself
 *   headline - on the first line of the message
 *   bottom-line - one the second line of the message
 */
const DonePage = new Lang.Class({
    Name: 'DonePage',
    GTypeName: 'EknReaderDonePage',
    Extends: Gtk.Frame,
    Properties: {
        /**
         * Property: progress-label
         *
         * The <Reader.ProgressLabel> widget created by this widget. Read-only,
         * modify using the progress label API.
         */
        'progress-label': GObject.ParamSpec.object('progress-label',
            'Progress label',
            'The progress indicator at the top of the page',
            GObject.ParamFlags.READABLE,
            ProgressLabel.ProgressLabel.$gtype),
        /**
         * Property: background-image-uri
         *
         * The background image uri for this page.
         * Gets set by the presenter.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri', 'Background image URI',
            'The background image of this page.',
            GObject.ParamFlags.READWRITE,
            ''),
    },

    _init: function (props) {
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });

        this._progress = new ProgressLabel.ProgressLabel({
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
        });
        let headline = new Gtk.Label({
            label: _("Did you like this issue?").toLocaleUpperCase(),
            expand: true,
            valign: Gtk.Align.END,
            halign: Gtk.Align.CENTER,
        });
        let bottom_line = new Gtk.Label({
            label: _("Don't miss next week's issue with more articles in your favorite magazine!"),
            expand: true,
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
        });

        grid.add(headline);
        grid.add(bottom_line);

        this._done_overlay = new Gtk.Overlay();
        this._done_overlay.add(grid);
        this._done_overlay.add_overlay(this._progress);

        this.add(this._done_overlay);

        headline.get_style_context().add_class(EosKnowledgePrivate.STYLE_CLASS_READER_HEADLINE);
        bottom_line.get_style_context().add_class(EosKnowledgePrivate.STYLE_CLASS_READER_BOTTOM_LINE);
        this.get_style_context().add_class(EosKnowledgePrivate.STYLE_CLASS_READER_DONE_PAGE);
    },

    get progress_label() {
        return this._progress;
    },

    get background_image_uri () {
        return this._background_image_uri;
    },

    set background_image_uri (v) {
        if (this._background_image_uri === v) {
            return;
        }
        this._background_image_uri = v;
        if (this._background_image_uri !== null) {
            let frame_css = '* { background-image: url("' + this._background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
    },
});
