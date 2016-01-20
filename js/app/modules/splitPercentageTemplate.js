// Copyright 2016 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: SplitPercentageTemplate
 * Template with a sidebar and content area
 */
const SplitPercentageTemplate = new Lang.Class({
    Name: 'SplitPercentageTemplate',
    GTypeName: 'EknSplitPercentageTemplate',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module ],

    Properties: {
        /**
         * Property: background-image-uri
         * The background image URI for this template.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'URI for background image of this widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.expand = true;
        this.parent(props);

        if (this.background_image_uri) {
            let frame_css = '* { background-image: url("' + this.background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }

        this._start_frame = new Gtk.Frame({
            expand: false,
        });
        this._end_frame = new Gtk.Frame({
            expand: false,
        });

        this._start = this.create_submodule('start');
        this._end = this.create_submodule('end');
        this._start_frame.add(this._start);
        this._end_frame.add(this._end);
        this.add(this._start_frame);
        this.add(this._end_frame);

        this._start_frame.get_style_context().add_class('start');
        this._end_frame.get_style_context().add_class('end');

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
    },

    _update_custom_style: function () {
        let start_fraction = EosKnowledgePrivate.widget_style_get_float(this, 'start-percentage');
        if (this._start_fraction === start_fraction)
            return;
        this._start_fraction = start_fraction;
        this.queue_resize();
    },

    get_slot_names: function () {
        return [ 'start', 'end' ];
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_height: function () {
        let [start_min, start_nat] = this._start_frame.get_preferred_height();
        let [end_min, end_nat] = this._end_frame.get_preferred_height();
        return [Math.max(start_min, end_min), Math.max(start_nat, end_nat)];
    },

    vfunc_get_preferred_width: function () {
        let [start_min, start_nat] = this._start_frame.get_preferred_height();
        let [end_min, end_nat] = this._end_frame.get_preferred_height();
        let min = start_min + end_min;
        let nat = Math.max(start_nat / this._start_fraction, end_nat / (1 - this._start_fraction));
        return [min, nat];
    },

    vfunc_draw: function (cr) {
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        Gtk.render_background(this.get_style_context(), cr,
            0, 0, width, height);
        this.parent(cr);
        cr.$dispose();
        return false;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let [start_min, start_nat] = this._start_frame.get_preferred_width();
        let [end_min, end_nat] = this._end_frame.get_preferred_width();

        let start_width = this._start_fraction * alloc.width;
        let end_width = (1 - this._start_fraction) * alloc.width;

        if (start_width < start_min) {
            start_width = start_min;
            end_width = alloc.width - start_width;
        }

        if (end_width < end_min) {
            end_width = end_min;
            start_width = alloc.width - end_width;
        }

        let start_on_left = this.get_direction() === Gtk.TextDirection.LTR;
        this._start_frame.size_allocate(new Cairo.RectangleInt({
            x: alloc.x + (start_on_left ? 0 : end_width),
            y: alloc.y,
            width: start_width,
            height: alloc.height,
        }));
        this._end_frame.size_allocate(new Cairo.RectangleInt({
            x: alloc.x + (start_on_left ? start_width : 0),
            y: alloc.y,
            width: end_width,
            height: alloc.height,
        }));
        Utils.set_container_clip(this);
    },
});

Gtk.Widget.install_style_property.call(SplitPercentageTemplate, GObject.ParamSpec.float(
    'start-percentage', 'Start Percentage', 'Start Percentage',
    GObject.ParamFlags.READABLE, 0, 1, 0.5));
