// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.config;
const ProgressLabel = imports.reader.progressLabel;

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
    Extends: Gtk.Overlay,
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
    },

    _init: function (props) {
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });

        this._progress = new ProgressLabel.ProgressLabel({
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
            margin_top: 5,
        });
        let headline = new Gtk.Label({
            label: _("Did you like this issue?"),
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
        this.add(grid);
        this.add_overlay(this._progress);

        headline.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_HEADLINE);
        bottom_line.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_BOTTOM_LINE);
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_DONE_PAGE);
    },

    get progress_label() {
        return this._progress;
    },
});
