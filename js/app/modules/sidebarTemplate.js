// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SidebarTemplate
 * This template has a fixed width sidebar and content area.
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
         * Sidebar fixed width.
         */
        'sidebar-width': GObject.ParamSpec.int('sidebar-width',
            'sidebar width', 'Preferred natural width for widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            1, GLib.MAXINT32, 400),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.expand = true;
        this.parent(props);

        let content_frame = new Gtk.Frame({
            expand: true,
        });
        let fixed_width_frame = new FixedWidthFrame({
            expand: false,
        });
        fixed_width_frame.width = this.sidebar_width;

        let sidebar = this.create_submodule('sidebar');
        let content = this.create_submodule('content', {
            valign: Gtk.Align.END,
        });

        content_frame.add(content);
        fixed_width_frame.add(sidebar);
        this.add(content_frame);
        this.add(fixed_width_frame);

        this.get_style_context().add_class(StyleClasses.SIDEBAR_TEMPLATE);
        content_frame.get_style_context().add_class(StyleClasses.CONTENT);
        fixed_width_frame.get_style_context().add_class(StyleClasses.SIDEBAR);
    },

    get_slot_names: function () {
        return [ 'sidebar', 'content' ];
    },
});

const FixedWidthFrame = new Lang.Class({
    Name: 'FixedWidthFrame',
    GTypeName: 'EknFixedWidthFrame',
    Extends: Gtk.Frame,

    vfunc_get_preferred_width: function () {
        return [this.width, this.width];
    },
});
