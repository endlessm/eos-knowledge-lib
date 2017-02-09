// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const SlidingPanel = imports.app.widgets.slidingPanel;

const _DEFAULT_TRANSITION_MS = 250;

/**
 * Class: SlidingPanelOverlay
 * Overlays a <SlidingPanel> above some content.
 */
const SlidingPanelOverlay = new Knowledge.Class({
    Name: 'SlidingPanelOverlay',
    Extends: Gtk.Overlay,

    Properties: {
        /**
         * Property: transition-duration
         * The duration of the animation of the overlays to visible/invisible
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration',
            'Transition Duration', 'Transition Duration',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, _DEFAULT_TRANSITION_MS),
    },

    _init: function (props) {
        this._transition_duration = _DEFAULT_TRANSITION_MS;
        this.parent(props);
        this._panels = [];
    },

    get transition_duration () {
        return this._transition_duration;
    },

    set transition_duration (v) {
        if (this._transition_duration === v)
            return;
        this._transition_duration = v;
        this.notify('transition-duration');
    },

    vfunc_get_child_position: function (panel, child_allocation) {
        if (!(panel instanceof SlidingPanel.SlidingPanel)) {
            this.parent(panel, child_allocation);
            return;
        }

        let clamp = (v, low, high) => Math.min(high, Math.max(low, v));

        let fill_percentage = EosKnowledgePrivate.style_context_get_custom_int(panel.get_style_context(),
                                                                               'fill-percentage');
        let shadow_margin = EosKnowledgePrivate.style_context_get_custom_int(panel.get_style_context(),
                                                                             'shadow-margin');

        let direction = panel.hide_direction;
        let [fill_coord, fill_size, align_coord, align_size] = ['x', 'width', 'y', 'height'];
        if (direction === Gtk.PositionType.LEFT || direction === Gtk.PositionType.RIGHT)
            [fill_coord, fill_size, align_coord, align_size] = ['y', 'height', 'x', 'width'];
        let start = (direction === Gtk.PositionType.TOP || direction === Gtk.PositionType.LEFT);

        let [min, nat] = panel.get_preferred_size();
        let allocation = this.get_allocation();
        child_allocation[fill_size] = clamp(nat[fill_size], allocation[fill_size] * fill_percentage, allocation[fill_size]);
        child_allocation[fill_coord] = (allocation[fill_size] - child_allocation[fill_size]) / 2;
        child_allocation[align_size] = nat[align_size];
        child_allocation[align_coord] = start ? 0 : allocation[align_size] - child_allocation[align_size];

        // Add the extra margin for drawing box shadows after the rest of
        // sizing. This way the fill fraction will still be accurate to the real
        // panel size.
        child_allocation.width += 2 * shadow_margin;
        child_allocation.height += 2 * shadow_margin;
        child_allocation.x -= shadow_margin;
        child_allocation.y -= shadow_margin;
    },

    add_panel_widget: function (widget, position) {
        let panel = new SlidingPanel.SlidingPanel({
            panel_widget: widget,
            hide_direction: position,
            hide_when_invisible: true,
        });

        this.bind_property('transition-duration',
           panel, 'transition-duration', GObject.BindingFlags.SYNC_CREATE);
        this.add_overlay(panel);
        this._panels.push(panel);
        return panel;
    },

    get_panel: function (widget) {
        for (let panel of this._panels) {
            if (panel.panel_widget === widget)
                return panel;
        }
        return null;
    },
});
