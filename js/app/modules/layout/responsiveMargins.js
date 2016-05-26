// Copyright 2015 Endless Mobile, Inc.

/* exported ResponsiveMargins */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: ResponsiveMargins
 * A module that displays a window and has responsive margins.
 *
 * Slots:
 *   content
 */
const ResponsiveMargins = new Module.Class({
    Name: 'ResponsiveMargins',
    CssName: 'EknResponsiveMargins',
    Extends: Gtk.Bin,

    StyleProperties: {
        'margin-threshold-small': GObject.ParamSpec.int('margin-threshold-small',
            'Margin Threshold Small', 'Margin Threshold Small',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 800),
        'margin-threshold-medium': GObject.ParamSpec.int('margin-threshold-medium',
            'Margin Threshold Medium', 'Margin Threshold Medium',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1000),
        'margin-threshold-large': GObject.ParamSpec.int('margin-threshold-large',
            'Margin Threshold Large', 'Margin Threshold Large',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1200),
        'margin-threshold-xlarge': GObject.ParamSpec.int('margin-threshold-xlarge',
            'Margin Threshold XLarge', 'Margin Threshold XLarge',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1500),
    },

    Slots: {
        'content': {},
    },

    _init: function (props={}) {
        this.parent(props);

        this.add(this.create_submodule('content'));

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
        this._thresholds = {
            small: 0,
            medium: 0,
            large: 0,
            xlarge: 0,
        };
    },

    _update_custom_style: function () {
        let changed = false;
        ['small', 'medium', 'large', 'xlarge'].forEach((klass) => {
            let threshold = EosKnowledgePrivate.widget_style_get_int(this, 'margin-threshold-' + klass);
            if (threshold === this._thresholds[klass])
                return;
            this._thresholds[klass] = threshold;
            changed = true;
        });
        if (changed)
            this.queue_resize(); // In upstream gtk, could actually be queue_allocate
    },

    _get_responsive_margins: function () {
        let context = this.get_style_context();
        let margins = {};
        ['tiny', 'small', 'medium', 'large', 'xlarge'].forEach((klass) => {
            context.save();
            context.add_class(klass);
            margins[klass] = context.get_margin(this.get_state_flags());
            context.restore();
        });
        return margins;
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        let margins = this._get_responsive_margins();
        return [margins.tiny.left + min + margins.tiny.right,
                margins.xlarge.left + nat + margins.xlarge.right];
    },

    vfunc_get_preferred_width_for_height: function () {
        // FIXME: No point trying to anything fancier here, as GtkFrame will
        // ignore width for height anyway at the moment
        return this.get_preferred_width();
    },

    vfunc_get_preferred_height: function () {
        let [min, nat] = this.parent();
        let margins = this._get_responsive_margins();
        return [margins.tiny.top + min + margins.tiny.bottom,
                margins.xlarge.top + nat + margins.xlarge.bottom];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let margins = this._get_responsive_margins();
        let min_width = width;
        if (width > 0)
            min_width = Math.max(1, min_width - margins.tiny.left - margins.tiny.right);
        let nat_width = width;
        if (width > 0)
            nat_width = Math.max(1, nat_width - margins.xlarge.left - margins.xlarge.right);
        let [min,] = this.parent(min_width);
        let [, nat] = this.parent(nat_width);
        return [margins.tiny.top + min + margins.tiny.bottom,
                margins.xlarge.top + Math.max(min, nat) + margins.xlarge.bottom];
    },

    vfunc_size_allocate: function (alloc) {
        this.set_allocation(alloc);

        let margins = this._get_responsive_margins();
        let [min_size, nat_size] = this.get_preferred_size();
        let base_min_width = min_size.width - margins.tiny.left - margins.tiny.right;
        let base_min_height = min_size.height - margins.tiny.top - margins.tiny.bottom;
        let margin = margins.tiny;
        ['small', 'medium', 'large', 'xlarge'].forEach((klass) => {
            let min_width_klass = margins[klass].left + margins[klass].right + base_min_width;
            let min_height_klass = margins[klass].top + margins[klass].bottom + base_min_height;
            if (alloc.width >= Math.max(min_width_klass, this._thresholds[klass]) &&
                alloc.height >= min_height_klass)
                margin = margins[klass];
        });
        alloc.x += margin.left;
        alloc.y += margin.top;
        alloc.width -= margin.left + margin.right;
        alloc.height -= margin.top + margin.bottom;
        this.get_child().size_allocate(alloc);
        Utils.set_container_clip(this);
    },

    vfunc_draw: function (cr) {
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        let style = this.get_style_context();
        Gtk.render_background(style, cr, 0, 0, width, height);
        Gtk.render_frame(style, cr, 0, 0, width, height);
        Gtk.render_focus(style, cr, 0, 0, width, height);
        this.parent(cr);
        cr.$dispose();
        return Gdk.EVENT_PROPAGATE;
    },
});
