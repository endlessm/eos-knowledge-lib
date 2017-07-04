// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Equations = imports.tweener.equations;
const Knowledge = imports.app.knowledge;

/**
 * Class: ToggleTweener
 * A helper to tween a widget between two states.
 *
 * The toggle tweener takes inactive and active values and will ease
 * between those two states over the <transition-duration>.
 *
 * Uses the widget's frame clock to update the tweening state.
 */
var ToggleTweener = new Knowledge.Class({
    Name: 'ToggleTweener',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: inactive-value
         * The value <get_value> should return when tweener is inactive.
         */
        'inactive-value': GObject.ParamSpec.float('inactive-value',
            'Inactive Value', 'Inactive Value',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            -1e10, 1e10, 0.0),
        /**
         * Property: active-value
         * The value <get_value> should return when tweener is active.
         */
        'active-value': GObject.ParamSpec.float('active-value',
            'Active Value', 'Active Value',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            -1e10, 1e10, 1.0),
        /**
         * Property: transition-duration
         * The time, in milliseconds, to transition from inactive to active.
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration',
            'Transition Duration', 'Transition Duration',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 250),
    },

    _init: function (widget, props={}) {
        this.parent(props);

        this._widget = widget;
        this._active = false;
        this._tween = 0;
        this._tick_id = 0;
    },

    /**
     * Method: set_active
     * Start transition to the active or inactive state.
     */
    set_active: function (active) {
        if (active === this._active)
            return;

        this._active = active;
        this._start_time = this._widget.get_frame_clock().get_frame_time();
        this._start_tween = this._tween;

        if (this._tick_id === 0)
            this._tick_id = this._widget.add_tick_callback(this._tick_callback.bind(this));
    },

    /**
     * Method: get_active
     * Get whether tweener is transitioning to active on inactive state.
     */
    get_active: function () {
        return this._active;
    },

    /**
     * Method: is_tweening
     * Returns true if the tweener is toggling.
     */
     is_tweening: function () {
        return this._tick_id !== 0;
     },

    _tick_callback: function (widget, frame_clock) {
        widget.queue_draw();

        let now = frame_clock.get_frame_time();
        let progress = (now - this._start_time) / this.transition_duration / 1000;
        this._tween = this._start_tween + (this._active ? progress : -progress);

        if (this._active && this._tween >= 1) {
            this._tween = 1;
            this._tick_id = 0;
            return GLib.SOURCE_REMOVE;
        }
        if (!this._active && this._tween <= 0) {
            this._tween = 0;
            this._tick_id = 0;
            return GLib.SOURCE_REMOVE;
        }
        return GLib.SOURCE_CONTINUE;
    },

    /**
     * Method: get_value
     * Gets the final interpolated value between <active-value> and <inactive-value>.
     */
    get_value: function () {
        // Could easily make the tweening function configurable
        // https://github.com/endlessm/gjs/blob/master/modules/tweener/equations.js
        return Equations.easeInOutQuad(this._tween,
                                       this.inactive_value,
                                       this.active_value - this.inactive_value,
                                       1);
    },
});
