// Copyright 2015 Endless Mobile, Inc.

/* exported ResponsiveMargins */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: ResponsiveMargins
 * A module that displays a window and has responsive margins.
 */
var ResponsiveMargins = new Module.Class({
    Name: 'Layout.ResponsiveMargins',
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
        'content': {
            requires: [
                Gtk.Widget,
            ],
        },
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
        ['small', 'medium', 'large', 'xlarge'].forEach((modifier) => {
            let threshold = EosKnowledgePrivate.style_context_get_custom_int(this.get_style_context(),
                                                                             'margin-threshold-' + modifier);
            if (threshold === this._thresholds[modifier])
                return;
            this._thresholds[modifier] = threshold;
            changed = true;
        });
        if (changed)
            this.queue_resize(); // In upstream gtk, could actually be queue_allocate
    },

    _get_responsive_margins: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();
        let margins = {};
        ['tiny', 'small', 'medium', 'large', 'xlarge'].forEach((modifier) => {
            context.save();
            context.set_state(flags);
            let klass = Utils.get_modifier_style_class(ResponsiveMargins, modifier);
            context.add_class(klass);
            margins[modifier] = context.get_margin(context.get_state());
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
        let margin = margins.tiny;
        ['small', 'medium', 'large', 'xlarge'].forEach((modifier) => {
            let min_width = margins[modifier].left + margins[modifier].right + base_min_width;
            if (alloc.width >= Math.max(min_width, this._thresholds[modifier]))
                margin = margins[modifier];
        });
        alloc.x += margin.left;
        alloc.width -= margin.left + margin.right;
        this.get_child().size_allocate(alloc);
        Utils.set_container_clip(this);
    },

    vfunc_draw: Utils.vfunc_draw_background_default,
});
