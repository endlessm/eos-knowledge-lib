// Copyright 2015 Endless Mobile, Inc.

const Cairo = imports.cairo;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Knowledge = imports.app.knowledge;

/**
 * Class: WidgetSurfaceCache
 * A helper for caching the results of a draw function to a surface.
 *
 * This object takes in a widget and a draw function, and will ready a cairo
 * surface with the results of the draw call whenever <get_surface> is called.
 *
 * Careful with this helper, only cache surfaces you know will not update!
 */
var WidgetSurfaceCache = new Knowledge.Class({
    Name: 'WidgetSurfaceCache',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: has-alpha
         * Whether the surface should have an alpha channel.
         */
        'has-alpha': GObject.ParamSpec.boolean('has-alpha',
            'Has Alpha', 'Has Alpha',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
        /**
         * Property: width
         * Width of the surface. If -1, allocated_width will be used.
         */
        'width': GObject.ParamSpec.int('width', 'Width', 'Width',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT32, -1),
        /**
         * Property: height
         * Height of the surface. If -1, allocated_height will be used.
         */
        'height': GObject.ParamSpec.int('height', 'Height', 'Height',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT32, -1),

    },

    _init: function (widget, draw, props={}) {
        this.parent(props);

        this._widget = widget;
        this._draw = draw;
        this._surface = null;

        // We may want to play with this in the future, but for now in the
        // interest of keeping memory usage low we will not store surfaces when
        // unmapped.
        widget.connect('unmap', () => this.invalidate());
    },

    /**
     * Method: invalidate
     * Invalidates the surface, so the next call to get_surface will redraw.
     */
    invalidate: function () {
        this._surface = null;
    },

    /**
     * Method: get_surface
     * Get the cached surface, redrawing if necessary.
     *
     * Optionally takes in a width and height, uses widget allocation by
     * default.
     */
    get_surface: function () {
        if (this._surface)
            return this._surface;

        let width = this.width > 0 ? this.width : this._widget.get_allocated_width();
        let height = this.height > 0 ? this.height : this._widget.get_allocated_height();
        let content = this.has_alpha ? Cairo.Content.COLOR_ALPHA : Cairo.Content.COLOR;
        this._surface = this._widget.get_window().create_similar_surface(content,
                                                                         width,
                                                                         height);
        let cr = new Cairo.Context(this._surface);
        this._draw(cr);
        cr.$dispose();
        return this._surface;
    },
});
