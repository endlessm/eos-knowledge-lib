// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const Module = imports.app.interfaces.module;
const ProgressLabel = imports.app.widgets.progressLabel;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: BackCover
 *
 * A module which displays information for the back cover of a reader
 * magazine app.
 */
const BackCover = new Lang.Class({
    Name: 'BackCover',
    GTypeName: 'EknBackCover',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: background-image-uri
         * URI of the page background
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'Background image URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: progress-label
         *
         * A widget showing where in the series of articles this page
         * resides. It is a <ProgressLabel> widget.
         */
        'progress-label': GObject.ParamSpec.object('progress-label', 'Progress Label',
            'The progress indicator at the top of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gtk.Widget),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/backCover.ui',
    InternalChildren: [ 'overlay', 'headline', 'subtitle' ],

    _init: function (props={}) {
        this.parent(props);

        this.progress_label = new ProgressLabel.ProgressLabel({
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
        });
        this._overlay.add_overlay(this.progress_label);

        // FIXME: Remove this once GTK supports making text uppercase in CSS
        this._headline.label = this._headline.label.toLocaleUpperCase();
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

function get_css_for_module (css_data) {
    let title_data = Utils.get_css_for_submodule('title', css_data);
    let str = Utils.object_to_css_string(title_data, '.back-cover .title');
    let module_data = Utils.get_css_for_submodule('module', css_data);
    str += Utils.object_to_css_string(module_data, '.back-cover .subtitle');
    return str;
}
