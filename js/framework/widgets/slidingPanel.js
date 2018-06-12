/* exported SlidingPanel */

// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.framework.knowledge;

const PanelFrame = new Knowledge.Class({
    Name: 'PanelFrame',
    Extends: Gtk.Bin,

    _init: function (panel, params={}) {
        this.parent(params);
        this.panel = panel;
    },

    vfunc_size_allocate: function (allocation) {
        this.set_allocation(allocation);
        if (!this.get_child())
            return;

        let shadow_margin = EosKnowledgePrivate.style_context_get_custom_int(this.panel.get_style_context(),
                                                                             'shadow-margin');

        // Remove the extra space given by the SlidingPanelOverlay
        allocation.width -= 2 * shadow_margin;
        allocation.height -= 2 * shadow_margin;
        allocation.x += shadow_margin;
        allocation.y += shadow_margin;
        this.get_child().size_allocate(allocation);
    },
});


/**
 * Class: SlidingPanel
 * A widget which can slide its contents visible or out of sight.
 */
var SlidingPanel = new Knowledge.Class({
    Name: 'SlidingPanel',
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
            Gtk.PositionType, Gtk.PositionType.TOP),
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
    StyleProperties: {
        // These custom style properties are specifically for when using the
        // slidingPanel in a slidingPanelOverlay. Fill percentage will control
        // how much of the side the panel is on to fill.
        'fill-percentage': GObject.ParamSpec.float('fill-percentage',
            'Fill percentage', 'Fill percentage',  GObject.ParamFlags.READABLE,
            0, 1, 1),
        // Shadow margin will add extra drawable area on the slidingPanel in a
        // slidingPanelOverlay. Useful for drawing a box-shadow.
        'shadow-margin': GObject.ParamSpec.int('shadow-margin', 'Shadow Margin',
            'Shadow Margin', GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 0),
    },

    _init: function (props={}) {
        this._panel_frame = new PanelFrame(this, {
            visible: true,
        });
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
                this.get_style_context().add_class(Gtk.STYLE_CLASS_TOP);
                break;
            case Gtk.PositionType.RIGHT:
                this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT_RIGHT;
                this.add(this._transparent_frame);
                this.add(this._panel_frame);
                this.get_style_context().add_class(Gtk.STYLE_CLASS_RIGHT);
                break;
            case Gtk.PositionType.BOTTOM:
                this.transition_type = Gtk.StackTransitionType.SLIDE_UP_DOWN;
                this.add(this._transparent_frame);
                this.add(this._panel_frame);
                this.get_style_context().add_class(Gtk.STYLE_CLASS_BOTTOM);
                break;
            case Gtk.PositionType.LEFT:
                this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT_RIGHT;
                this.add(this._panel_frame);
                this.add(this._transparent_frame);
                this.get_style_context().add_class(Gtk.STYLE_CLASS_LEFT);
                break;
            default:
                logError(new Error('Warning: unhandled hide_direction value ' + this.hide_direction));
                break;
        }

        this.set_visible_child(this._reveal_panel ? this._panel_frame : this._transparent_frame);

        this.connect('notify::transition-running', this._eval_visibility.bind(this));
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

        /* Make sure hide_when_invisible works if GTK animations are disabled */
        this._eval_visibility();
    },

    _eval_visibility: function () {
        if (this.transition_running)
            return;

        if (!this.reveal_panel && this.hide_when_invisible)
            this.visible = false;

        this.notify('panel-revealed');
    },
});
