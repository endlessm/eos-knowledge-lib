// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;

/**
 * Class: SlidingPanel
 * A widget which can slide its contents visible or out of sight.
 */
const SlidingPanel = new Lang.Class({
    Name: 'SlidingPanel',
    GTypeName: 'EknSlidingPanel',
    Extends: Gtk.Stack,

    Properties: {
        /**
         * Property: hide-direction
         * Direction to slide out of sight when hiding.
         *
         * We could make this mutable, but right now there's no need so keeping
         * construct only to keep the code simpler
         */
        'hide-direction': GObject.ParamSpec.enum('hide-direction',
            'Hide Direction', 'Hide Direction',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.DirectionType, Gtk.PositionType.TOP),
        /**
         * Property: panel-widget
         * The widget that slides in and out.
         */
        'panel-widget': GObject.ParamSpec.object('panel-widget',
            'Panel widget', 'Panel widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            Gtk.Widget),
        /**
         * Property: reveal-panel
         * Whether the container should reveal the child. 
         */
        'reveal-panel': GObject.ParamSpec.boolean('reveal-panel',
            'Reveal Panel', 'Reveal Panel',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: panel-revealed
         * True if the panel is fully revealed or animating to the hidden state.
         */
        'panel-revealed': GObject.ParamSpec.boolean('panel-revealed',
            'Panel Revealed', 'Panel Revealed',
            GObject.ParamFlags.READABLE, false),
        /**
         * Property: hide-when-invisible
         *
         * True if the panel should hide entirely when not animating or showing
         * the widget.
         */
        'hide-when-invisible': GObject.ParamSpec.boolean('hide-when-invisible',
            'Hide When Invisible', 'Hide When Invisible',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this._panel_frame = new Gtk.Frame({
            visible: true,
        });
        this._panel_frame.get_style_context().add_class(StyleClasses.PANEL);
        this._transparent_frame = new Gtk.Frame({
            visible: true,
        });
        this.parent(props);

        if (this.hide_when_invisible)
            this.no_show_all = true;

        switch(this.hide_direction) {
            case Gtk.PositionType.TOP:
                this.transition_type = Gtk.StackTransitionType.SLIDE_UP_DOWN;
                this.add(this._panel_frame);
                this.add(this._transparent_frame);
                this._panel_frame.get_style_context().add_class(Gtk.STYLE_CLASS_TOP);
                break;
            case Gtk.PositionType.RIGHT:
                this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT_RIGHT;
                this.add(this._transparent_frame);
                this.add(this._panel_frame);
                this._panel_frame.get_style_context().add_class(Gtk.STYLE_CLASS_RIGHT);
                break;
            case Gtk.PositionType.BOTTOM:
                this.transition_type = Gtk.StackTransitionType.SLIDE_UP_DOWN;
                this.add(this._transparent_frame);
                this.add(this._panel_frame);
                this._panel_frame.get_style_context().add_class(Gtk.STYLE_CLASS_BOTTOM);
                break;
            case Gtk.PositionType.LEFT:
                this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT_RIGHT;
                this.add(this._panel_frame);
                this.add(this._transparent_frame);
                this._panel_frame.get_style_context().add_class(Gtk.STYLE_CLASS_LEFT);
                break;
        }

        this.set_visible_child(this._reveal_panel ? this._panel_frame : this._transparent_frame);

        this.connect('notify::transition-running', () => {
            if (this.transition_running)
                return;
            if (!this.reveal_panel && this.hide_when_invisible)
                this.visible = false;
            this.notify('panel-revealed');
        });
    },

    get panel_widget () {
        return this._panel_frame.get_child();
    },

    set panel_widget (v) {
        if (this._panel_frame.get_child())
            this._panel_frame.remove(this._panel_frame.get_child());
        if (v)
            this._panel_frame.add(v);
    },

    get panel_revealed () {
        if (this.transition_running)
            return !this.reveal_panel;
        return this.reveal_panel;
    },

    get reveal_panel () {
        return this._reveal_panel;
    },

    set reveal_panel (v) {
        if (v === this._reveal_panel)
            return;
        this._reveal_panel = v;
        if (v && this.hide_when_invisible)
            this.visible = true;
        if (this.get_children().length > 0)
            this.set_visible_child(v ? this._panel_frame : this._transparent_frame);
    },
});

// These custom style properties are specifically for when using the
// slidingPanel in a slidingPanelOverlay. Fill percentage will control how much
// of the side the panel is on to fill.
Gtk.Widget.install_style_property.call(SlidingPanel, GObject.ParamSpec.float(
    'fill-percentage', 'Fill percentage', 'Fill percentage',
    GObject.ParamFlags.READABLE, 0, 1, 1));
