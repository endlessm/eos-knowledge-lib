// Copyright 2015 Endless Mobile, Inc.

/* exported ResponsiveMarginsModule */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: ResponsiveMarginsModule
 * A module that displays a window and has responsive margins.
 */
const ResponsiveMarginsModule = new Lang.Class({
    Name: 'ResponsiveMarginsModule',
    GTypeName: 'EknResponsiveMarginsModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
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
                margins.large.left + nat + margins.large.right];
    },

    vfunc_get_preferred_width_for_height: function (height) {
        let [min, nat] = this.parent(height);
        let margins = this._get_responsive_margins();
        return [margins.tiny.left + min + margins.tiny.right,
                margins.large.left + nat + margins.large.right];
    },

    vfunc_get_preferred_height: function () {
        let [min, nat] = this.parent();
        let margins = this._get_responsive_margins();
        return [margins.tiny.top + min + margins.tiny.bottom,
                margins.large.top + nat + margins.large.bottom];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let [min, nat] = this.parent(width);
        let margins = this._get_responsive_margins();
        return [margins.tiny.top + min + margins.tiny.bottom,
                margins.large.top + nat + margins.large.bottom];
    },

    vfunc_size_allocate: function (alloc) {
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
        this.parent(alloc);
    },

    // Module override
    get_slot_names: function () {
        return ['content'];
    },
});

Gtk.Widget.install_style_property.call(ResponsiveMarginsModule, GObject.ParamSpec.int(
    'margin-threshold-small', 'Margin Threshold Small', 'Margin Threshold Small',
    GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 800));
Gtk.Widget.install_style_property.call(ResponsiveMarginsModule, GObject.ParamSpec.int(
    'margin-threshold-medium', 'Margin Threshold Medium', 'Margin Threshold Medium',
    GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1000));
Gtk.Widget.install_style_property.call(ResponsiveMarginsModule, GObject.ParamSpec.int(
    'margin-threshold-large', 'Margin Threshold Large', 'Margin Threshold Large',
    GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1200));
Gtk.Widget.install_style_property.call(ResponsiveMarginsModule, GObject.ParamSpec.int(
    'margin-threshold-xlarge', 'Margin Threshold XLarge', 'Margin Threshold XLarge',
    GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 1500));
