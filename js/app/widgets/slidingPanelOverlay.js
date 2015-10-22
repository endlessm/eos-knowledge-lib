// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SlidingPanel = imports.app.widgets.slidingPanel;

/**
 * Class: SlidingPanelOverlay
 * Overlays a <SlidingPanel> above some content.
 */
const SlidingPanelOverlay = new Lang.Class({
    Name: 'SlidingPanelOverlay',
    GTypeName: 'SlidingPanelOverlay',
    Extends: Gtk.Overlay,

    Properties: {
        /**
         * Property: transition-duration
         * The duration of the animation of the overlays to visible/invisible
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration',
            'Transition Duration', 'Transition Duration',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 250),
    },

    _init: function (props) {
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

    add_panel_widget: function (widget, position) {
        let panel = new SlidingPanel.SlidingPanel({
            panel_widget: widget,
            hide_direction: position,
            hide_when_invisible: true,
        });
        if (position === Gtk.PositionType.TOP) {
            panel.valign = Gtk.Align.START;
            panel.halign = Gtk.Align.FILL;
        } else if (position === Gtk.PositionType.RIGHT) {
            panel.valign = Gtk.Align.FILL;
            panel.halign = Gtk.Align.END;
        } else if (position === Gtk.PositionType.BOTTOM) {
            panel.valign = Gtk.Align.END;
            panel.halign = Gtk.Align.FILL;
        } else {
            panel.valign = Gtk.Align.FILL;
            panel.halign = Gtk.Align.START;
        }

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
