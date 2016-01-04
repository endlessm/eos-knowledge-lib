// Copyright 2015 Endless Mobile, Inc.

/* exported SidebarTemplate, get_css_for_module */

const Cairo = imports.gi.cairo;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

const _PAGE_WIDTH_THRESHOLD_PX = 1366;
const _MARGIN_DIFF_PX = 50;

const _FixedWidthFrame = new Lang.Class({
    Name: 'FixedWidthFrame',
    GTypeName: 'EknFixedWidthFrame',
    Extends: Gtk.Frame,

    vfunc_get_preferred_width: function () {
        return [this.width, this.width];
    },
});

const _MaxWidthFrame = new Lang.Class({
    Name: 'MaxWidthFrame',
    GTypeName: 'EknMaxWidthFrame',
    Extends: Gtk.Frame,

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [Math.min(min, this.width), Math.min(nat, this.width)];
    },
});

/**
 * Class: SidebarTemplate
 * Template with a sidebar and content area
 *
 * The <sidebar-width> property controls the width of the sidebar slot, and the
 * <fixed> property controls whether this is a fixed or a maximum width.
 * This template can also set a background image in code.
 *
 * The layout is responsive to screen size changes.
 * If the template's width is less than 1366 pixels, then 50 pixels will be
 * deducted from the left margin of the content submodule and the right margin
 * of the sidebar submodule.
 *
 * Slots:
 *   sidebar
 *   content
 *
 * CSS Styles:
 *   sidebar-template - on the template
 *   sidebar - a frame containing the sidebar module
 *   content - a frame containing the content module
 */
const SidebarTemplate = new Lang.Class({
    Name: 'SidebarTemplate',
    GTypeName: 'EknSidebarTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        /**
         * Property: sidebar-width
         * Sidebar width in pixels.
         *
         * Default:
         *   400
         */
        'sidebar-width': GObject.ParamSpec.int('sidebar-width',
            'sidebar width', 'Sidebar width in pixels',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            1, GLib.MAXINT32, 400),

        /**
         * Property: fixed
         * True if the <sidebar-width> is a fixed width, false if a maximum.
         *
         * Default:
         *   true
         */
        'fixed': GObject.ParamSpec.boolean('fixed', 'Fixed',
            'Whether the width is a fixed width or maximum width',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),

        /**
         * Property: on-left
         * True if the sidebar should be on the left.
         */
        'on-left':  GObject.ParamSpec.boolean('on-left', 'On Left', 'On Left',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),

        /**
         * Property: background-image-uri
         * The background image URI for this template.
         *
         * Generally set to a resource:// URI and generally takes up the whole
         * page.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'URI for background image of this widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: subtitle
         * The application subtitle
         *
         * The specific subtitle of this Knowledge App.
         */
        'subtitle': GObject.ParamSpec.string('subtitle', 'subtitle',
            'Application subtitle',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    SIDEBAR_WIDTH_MIN: 240,
    SIDEBAR_WIDTH_THRESHOLD: 800,

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.expand = true;
        this.parent(props);

        if (this.background_image_uri) {
            let frame_css = '* { background-image: url("' + this.background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }

        this.content_frame = new Gtk.Frame({
            expand: true,
        });
        let SidebarFrameClass = this.fixed ? _FixedWidthFrame : _MaxWidthFrame;
        this.sidebar_frame = new SidebarFrameClass({
            expand: false,
        });
        this.sidebar_frame.width = this.sidebar_width;

        this._sidebar = this.create_submodule('sidebar');
        if (this.subtitle) {
            this._content = this.create_submodule('content', {
                'subtitle': this.subtitle,
            });
        } else {
            this._content = this.create_submodule('content');
        }

        this.content_frame.add(this._content);
        this.sidebar_frame.add(this._sidebar);
        let children = [this.sidebar_frame, this.content_frame];
        if (!this.on_left)
            children.reverse();
        children.forEach((child) => this.add(child));

        this.get_style_context().add_class(StyleClasses.SIDEBAR_TEMPLATE);
        this.content_frame.get_style_context().add_class(StyleClasses.CONTENT);
        this.sidebar_frame.get_style_context().add_class(StyleClasses.SIDEBAR);

        this._content_base_margin_start = this._content.margin_start;
        this._sidebar_base_margin_end = this._sidebar.margin_end;
        this.connect('size-allocate', this._update_margins.bind(this));
        this._update_margins(this, this.get_allocation());

        this._orig_sidebar_width = this.sidebar_width;
    },

    _update_margins: function (widget, alloc) {
        if (alloc.width >= _PAGE_WIDTH_THRESHOLD_PX) {
            this._content.margin_start = this._content_base_margin_start;
            this._sidebar.margin_end = this._sidebar_base_margin_end;
        } else {
            this._content.margin_start = Math.max(0,
                this._content_base_margin_start - _MARGIN_DIFF_PX);
            this._sidebar.margin_end = Math.max(0,
                this._sidebar_base_margin_end - _MARGIN_DIFF_PX);
        }
    },

    get_slot_names: function () {
        return [ 'sidebar', 'content' ];
    },

    vfunc_size_allocate: function (alloc) {
        // We need to adjust the sidebar width for apps with a fixed-width sidebar
        if (this.fixed) {
            if (alloc.width < this.SIDEBAR_WIDTH_THRESHOLD) {
                this.sidebar_width = this.SIDEBAR_WIDTH_MIN;
            } else {
                this.sidebar_width = this._orig_sidebar_width;
            }
            this.sidebar_frame.width = this.sidebar_width;
        }

        this.parent(alloc);
    },
});

function get_css_for_module(css_data) {
    let module_data = Utils.get_css_for_submodule('module', css_data);
    return Utils.object_to_css_string(module_data, '.' + StyleClasses.SIDEBAR);
}
