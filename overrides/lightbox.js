const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const CompositeButton = imports.compositeButton;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Lightbox
 * Show widget in a lightbox above other content
 *
 * EosKnowledge.Lightbox is a container which allows displaying a
 * <lightbox-widget> above some base content. The base content widget
 * should be added with lightbox.add().
 *
 * An optional <infobox-widget> can also be added, in a infobox panel
 * underneath the <lightbox-widget> widget.
 *
 * To show or hide both of these widgets above the main content, set the
 * <reveal-overlays> property. The lightbox will animate the content visible
 * and invisible and update the <overlays-revealed> property when the
 * animation is complete.
 *
 * You need to call show() on both the <lightbox-widget> and <infobox-widget>
 * before adding them to the lightbox. To respect the <reveal-overlays>
 * property show_all() will not work on the widget overlays.
 */
const Lightbox = new Lang.Class({
    Name: 'Lightbox',
    GTypeName: 'EknLightbox',
    Extends: Gtk.Overlay,
    Properties: {
        /**
         * Property: lightbox-widget
         * The widget to display centered in the lightbox above the content
         */
        'lightbox-widget': GObject.ParamSpec.object('lightbox-widget', 'Lightbox Widget',
            'The widget in the lightbox',
            GObject.ParamFlags.READWRITE, Gtk.Widget),
        /**
         * Property: infobox-widget
         * An optional widget to appear at the bottom of the lightbox with
         * information about the widget being previewed
         */
        'infobox-widget': GObject.ParamSpec.object('infobox-widget', 'Infobox Widget',
            'Optional widget to appear to appear at the bottom of the lightbox',
            GObject.ParamFlags.READWRITE, Gtk.Widget),
        /**
         * Property: reveal-overlays
         * True if lightbox and infobox should be visible above main content
         */
        'reveal-overlays': GObject.ParamSpec.boolean('reveal-overlays', 'Reveal Overlays',
            'True if lightbox and infobox should be visible above main content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: overlays-revealed
         * True if lightbox and infobox are revealed and animation target reached
         */
        'overlays-revealed': GObject.ParamSpec.boolean('overlays-revealed', 'Overlays Revealed',
            'True if lightbox and infobox are revealed and animation target reached',
            GObject.ParamFlags.READABLE, false),
        /**
         * Property: transition-duration
         * The duration of the animation of the overlays to visible/invisible
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration', 'Transition Duration',
            'The duration of the animation of the overlays to visible/invisible',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 250)
    },

    _init: function (params) {
        // Property values
        this._lightbox_widget = null;
        this._infobox_widget = null;
        this._reveal_overlays = false;

        this._lightbox_container = new LightboxContainer();
        this._lightbox_container.connect('clicked', Lang.bind(this, function () {
            this.reveal_overlays = false;
        }));

        this._infobox_container = new InfoboxContainer();

        let inner_overlay = new Gtk.Overlay();
        inner_overlay.add(this._lightbox_container);
        inner_overlay.add_overlay(this._infobox_container);
        inner_overlay.show_all();

        this._revealer = new HackRevealer({
            no_show_all: true,
            transition_type: Gtk.RevealerTransitionType.CROSSFADE
        });
        this._revealer.add(inner_overlay);
        this._revealer.connect('notify::child-revealed', Lang.bind(this, function () {
            if (!this._revealer.child_revealed) {
                this._revealer.hide();
                this._infobox_container.set_reveal_info_widget(false);
            }
            this.notify('overlays-revealed');
        }));

        this.parent(params);
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX);
        this.bind_property('transition-duration',
                           this._revealer, 'transition-duration',
                           GObject.BindingFlags.SYNC_CREATE);
        this.add_overlay(this._revealer);
    },

    set reveal_overlays (v) {
        if (this._reveal_overlays === v)
            return;
        this._reveal_overlays = v;
        if (this._reveal_overlays) {
            this._revealer.show();
            this._revealer.reveal_child = true;
        } else {
            this._revealer.reveal_child = false;
        }
        this.notify('reveal-overlays');
    },

    get reveal_overlays () {
        return this._reveal_overlays;
    },

    get overlays_revealed () {
        return this._revealer !== undefined && this._revealer.child_revealed;
    },

    set lightbox_widget (v) {
        if (this._lightbox_widget === v)
            return;
        if (this._lightbox_widget !== null)
            this._lightbox_container.remove(this._lightbox_widget);
        this._lightbox_widget = v;
        if (this._lightbox_widget !== null)
            this._lightbox_container.add(this._lightbox_widget);
        this.notify('lightbox-widget');
    },

    get lightbox_widget () {
        return this._lightbox_widget;
    },

    set infobox_widget (v) {
        if (this._infobox_widget === v)
            return;
        if (this._infobox_widget !== null)
            this._infobox_container.remove_info_widget(this._infobox_widget);
        this._infobox_widget = v;
        if (this._infobox_widget !== null)
            this._infobox_container.add_info_widget(this._infobox_widget);
        this.notify('infobox-widget');
    },

    get infobox_widget () {
        return this._infobox_widget;
    }
});

// This revealer works around a bug in GtkRevealer's size_allocate
// https://bugzilla.gnome.org/show_bug.cgi?id=724742. The bug is fixed
// upstream and this class should be removed when we move to Gtk 3.12
const HackRevealer = new Lang.Class({
    Name: 'HackRevealer',
    GTypeName: 'EknHackRevealer',
    Extends: Gtk.Revealer,

    vfunc_size_allocate: function (alloc) {
        let child = this.get_child();
        if (child)
            child.height_request = alloc.height;
        this.parent(alloc);
        if (child)
            child.height_request = -1;
    }
});

// A private container used to house the lightbox-widget in the overlay. Right
// now just a GtkAlignment which listens to the exact mouse event we care
// about and can draw a background. In the future probably a grid or custom
// container which holds our x button, arrow buttons as well as the lightbox-
// widget.
const LightboxContainer = new Lang.Class({
    Name: 'LightboxContainer',
    GTypeName: 'EknLightboxContainer',
    Extends: Gtk.Alignment,
    Signals: {
        'clicked': {}
    },

    _init: function (params) {
        params = params || {};
        params.xscale = 0.0;
        params.yscale = 0.0;
        this.parent(params);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX_SHADOW);
        this.set_events(Gdk.EventMask.BUTTON_PRESS_MASK | Gdk.EventMask.BUTTON_RELEASE_MASK);
        this.set_has_window(true);

        this.connect('button-release-event', Lang.bind(this, this._button_release));
    },

    vfunc_realize: function () {
        this.set_realized(true);
        let alloc = this.get_allocation();
        // FIXME: when gdk_window_attr is introspectable we can get rid of the
        // c wrapper. https://bugzilla.gnome.org/show_bug.cgi?id=727801
        // let attributes = new Gdk.WindowAttr();
        // attributes.window_type = Gdk.WindowType.CHILD;
        // attributes.x = alloc.x;
        // attributes.y = alloc.y;
        // attributes.width = alloc.width;
        // attributes.height = alloc.height;
        // attributes.wclass = Gdk.WindowWindowClass.INPUT_OUTPUT;
        // attributes.event_mask = this.get_events();
        // attributes.visual = this.get_visual();
        // let attributes_mask = Gdk.WindowAttributesType.X |
        //                       Gdk.WindowAttributesType.Y |
        //                       Gdk.WindowAttributesType.VISUAL;
        // let window = Gdk.Window.new(this.get_parent_window(),
        //                             attributes,
        //                             attributes_mask);
        let window = EosKnowledge.private_new_input_output_window(this);
        this.set_window(window);
        this.register_window(window);
    },

    vfunc_draw: function (cr) {
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        let context = this.get_style_context();
        Gtk.render_background(context, cr, 0, 0, width, height);
        Gtk.render_frame(context, cr, 0, 0, width, height);
        let ret = this.parent(cr);
        cr.$dispose();
        return ret;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        if (this.get_realized())
            this.get_window().move_resize(alloc.x, alloc.y,
                                          alloc.width, alloc.height);
    },

    _button_release: function (widget, event) {
        let [has_button, button] = event.get_button();
        let [has_coords, event_x, event_y] = event.get_coords();
        // If the event doesn't have the information we need something has
        // gone wrong
        if (!has_button || !has_coords) {
            printerr("Unexpected event in lightbox button release handler");
            return;
        }
        // We only care about button 1, the left mouse button.
        if (button !== 1)
            return;
        // If the event was generated on our child widgets GdkWindows, don't
        // emit a clicked signal (the user clicked on the lightbox-widget).
        if (event.get_window() !== this.get_window())
            return;
        // Not all child widgets will have their own GdkWindows capturing
        // mouse events. If event is generated inside child widgets allocation
        // return.
        if (this.get_child()) {
            let child_alloc = this.get_child().get_allocation();
            if (event_x >= child_alloc.x &&
                event_y >= child_alloc.y &&
                event_x <= child_alloc.x + child_alloc.width &&
                event_y <= child_alloc.y + child_alloc.height)
                return;
        }
        // Event must have been in the shadowed area of the container.
        this.emit('clicked');
    }
});

// A private container used to house the lightbox-widget in the overlay.
// Collapses and expands the infobox widget inside when the users clicks on
// it.
const InfoboxContainer = new Lang.Class({
    Name: 'InfoboxContainer',
    GTypeName: 'EknInfoboxContainer',
    Extends: CompositeButton.CompositeButton,

    DOWN_ICON: 'go-down',
    UP_ICON: 'go-up',

    _init: function (params) {
        params = params || {};
        params.halign = Gtk.Align.CENTER;
        params.valign = Gtk.Align.END;
        params.no_show_all = true;
        this.parent(params);

        this._image = new Gtk.Image({
            icon_name: this.UP_ICON
        });
        this._image.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX_ARROW);
        this._infobox_revealer = new Gtk.Revealer({
            transition_duration: 1000,
            transition_type: Gtk.RevealerTransitionType.SLIDE_UP
        });
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(this._image);
        grid.add(this._infobox_revealer);
        this.add(grid);
        grid.show_all();

        this.setSensitiveChildren([this._image]);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX);
        this.connect('clicked', Lang.bind(this, function () {
            this.set_reveal_info_widget(!this.get_reveal_info_widget());
        }));
    },

    // Get/set whether the infobox widget should be in collapsed or expanded
    // state.
    get_reveal_info_widget: function () {
        return this._infobox_revealer.reveal_child;
    },

    set_reveal_info_widget: function (reveal) {
        this._infobox_revealer.reveal_child = reveal;
        this._image.icon_name = reveal ? this.DOWN_ICON : this.UP_ICON;
    },

    remove_info_widget: function (widget) {
        this._infobox_revealer.remove(widget);
        this.hide();
    },

    add_info_widget: function (widget) {
        this._infobox_revealer.add(widget);
        this.show();
    }
});
