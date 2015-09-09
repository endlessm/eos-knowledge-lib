// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const _LOGO_TOP_MARGIN = 50;
const _LOGO_LEFT_MARGIN = 75;
const _FRAME_RIGHT_MARGIN = 100;
const _PAGE_WIDTH_THRESHOLD = 1366;
const _MARGIN_DIFF = 50;

/**
 * Class: Reader.OverviewPage
 * Splash Page shown in the reader when the app opens
 *
 * This page shows the title image of the app, and a series of snippets for
 * some of the articles in the current issue.
 *
 * CSS classes:
 *   overview-page - on the page itself
 */
const OverviewPage = new Lang.Class({
    Name: 'OverviewPage',
    GTypeName: 'EknReaderOverviewPage',
    Extends: Gtk.Frame,
    Properties: {
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    _init: function (props) {
        props = props || {};
        props.hexpand = true;

        this.parent(props);

        this._app_banner = this.factory.create_named_module('app-banner', {
            halign: Gtk.Align.START,
            margin_top: _LOGO_TOP_MARGIN,
            margin_start: _LOGO_LEFT_MARGIN,
        });

        this._template = this.factory.create_named_module('front-cover', {
            column_homogeneous: true,
            column_spacing: 120,
        });
        this._template.content_frame.add(this._app_banner);

        this._snippets_group = this.factory.create_named_module('snippets-group', {
            expand: true,
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
            margin_end: _FRAME_RIGHT_MARGIN,
        });
        this._template.sidebar_frame.add(this._snippets_group);

        this.get_style_context().add_class(StyleClasses.READER_OVERVIEW_PAGE);

        this._template.connect('size-allocate', (grid, alloc) => {
            if (alloc.width >= _PAGE_WIDTH_THRESHOLD) {
                this._app_banner.margin_start = _LOGO_LEFT_MARGIN;
                this._snippets_group.margin_end = _FRAME_RIGHT_MARGIN;
            } else {
                this._app_banner.margin_start = _LOGO_LEFT_MARGIN - _MARGIN_DIFF;
                this._snippets_group.margin_end = _FRAME_RIGHT_MARGIN - _MARGIN_DIFF;
            }
        });

        this.add(this._template);
    },
});
