// Copyright 2015 Endless Mobile, Inc.

/* exported Sidebar */

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

/**
 * Class: Sidebar
 * Template with a sidebar and content area
 *
 * CSS Styles:
 *   sidebar-template - on the template
 *   sidebar - a frame containing the sidebar module
 *   content - a frame containing the content module
 */
var Sidebar = new Module.Class({
    Name: 'Layout.Sidebar',
    Extends: Endless.CustomContainer,

    Properties: {
        /**
         * Property: sidebar-first
         * True if the sidebar should be first in the reading direction.
         */
        'sidebar-first':  GObject.ParamSpec.boolean('sidebar-first', 'Sidebar First', 'Sidebar First',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },
    StyleProperties: {
        'sidebar-width-large': GObject.ParamSpec.int('sidebar-width-large',
            'Sidebar Width Large', 'Sidebar Width Large',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 400),
        'sidebar-width-small': GObject.ParamSpec.int('sidebar-width-small',
            'Sidebar Width Small', 'Sidebar Width Small',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 240),
        'threshold-width-large': GObject.ParamSpec.int('threshold-width-large',
            'Threshold Width Large', 'Threshold Width Large',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 800),
    },

    Slots: {
        'sidebar': {},
        'content': {},
    },

    _init: function (props={}) {
        props.expand = true;
        this.parent(props);

        this.content_frame = new Gtk.Frame({
            expand: true,
        });
        this.sidebar_frame = new Gtk.Frame({
            expand: false,
        });

        this._sidebar = this.create_submodule('sidebar');
        this._content = this.create_submodule('content');

        this.content_frame.add(this._content);
        this.sidebar_frame.add(this._sidebar);
        this.add(this.content_frame);
        this.add(this.sidebar_frame);

        this.content_frame.get_style_context().add_class('content');
        this.sidebar_frame.get_style_context().add_class('sidebar');

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
    },

    _update_custom_style: function () {
        let threshold_width_large = EosKnowledgePrivate.style_context_get_custom_int(this.get_style_context(),
                                                                                     'threshold-width-large');
        let sidebar_width_large = EosKnowledgePrivate.style_context_get_custom_int(this.get_style_context(),
                                                                                   'sidebar-width-large');
        let sidebar_width_small = EosKnowledgePrivate.style_context_get_custom_int(this.get_style_context(),
                                                                                   'sidebar-width-small');
        if (typeof this._threshold_width_large !== 'undefined' &&
            typeof this._sidebar_width_large !== 'undefined' &&
            typeof this._sidebar_width_small !== 'undefined' &&
            this._threshold_width_large === threshold_width_large &&
            this._sidebar_width_large === sidebar_width_large &&
            this._sidebar_width_small === sidebar_width_small)
            return;
        this._threshold_width_large = threshold_width_large;
        this._sidebar_width_large = sidebar_width_large;
        this._sidebar_width_small = sidebar_width_small;
        this.queue_resize();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    _get_sidebar_width: function (width) {
        let [content_min,] = this.content_frame.get_preferred_width();
        let [sidebar_min,] = this.sidebar_frame.get_preferred_width();

        let sidebar_width = this._sidebar_width_small;
        if (width - content_min >= this._sidebar_width_large &&
            width >= this._threshold_width_large)
            sidebar_width = this._sidebar_width_large;
        return Math.max(sidebar_width, sidebar_min);
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let sidebar_width = this._get_sidebar_width(width);
        let content_width = width - sidebar_width;
        let [content_min, content_nat] = this.content_frame.get_preferred_height_for_width(content_width);
        let [sidebar_min, sidebar_nat] = this.sidebar_frame.get_preferred_height_for_width(sidebar_width);
        return [Math.max(content_min, sidebar_min), Math.max(content_nat, sidebar_nat)];
    },

    vfunc_get_preferred_width: function () {
        let [content_min, content_nat] = this.content_frame.get_preferred_width();
        let [sidebar_min, sidebar_nat] = this.sidebar_frame.get_preferred_width();
        let min = Math.max(sidebar_min, this._sidebar_width_small) + content_min;
        let nat = Math.max(sidebar_min, this._sidebar_width_large) + content_nat;
        return [min, nat];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let sidebar_width = this._get_sidebar_width(alloc.width);
        let content_width = alloc.width - sidebar_width;

        let sidebar_left = this.sidebar_first;
        if (this.get_direction() === Gtk.TextDirection.RTL)
            sidebar_left = !sidebar_left;
        this.sidebar_frame.size_allocate(new Gdk.Rectangle({
            x: alloc.x + (sidebar_left ? 0 : content_width),
            y: alloc.y,
            width: sidebar_width,
            height: alloc.height,
        }));
        this.content_frame.size_allocate(new Gdk.Rectangle({
            x: alloc.x + (sidebar_left ? sidebar_width : 0),
            y: alloc.y,
            width: content_width,
            height: alloc.height,
        }));
        Utils.set_container_clip(this);
    },

    vfunc_draw: Utils.vfunc_draw_background_default,
});
