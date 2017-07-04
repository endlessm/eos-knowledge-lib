const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

/**
 * Class: Lightbox
 * Show widget in a lightbox above other content
 *
 * EosKnowledgePrivate.Lightbox is a container which allows displaying a
 * <lightbox-widget> above some other base content. The base content
 * should be added with lightbox.add().
 *
 * To show or hide both of these widgets above the main content, set the
 * <reveal-overlays> property. The lightbox will animate the content visible
 * and invisible and update the <overlays-revealed> property when the
 * animation is complete.
 *
 * You need to call show() on the <lightbox-widget> before adding it to the
 * lightbox. To respect the <reveal-overlays> property show_all() will not work
 * on the widget overlays.
 */
var Lightbox = new Knowledge.Class({
    Name: 'Lightbox',
    Extends: Gtk.Overlay,
    Properties: {
        /**
         * Property: lightbox-widget
         * The widget to display centered in the lightbox above the base content
         */
        'lightbox-widget': GObject.ParamSpec.object('lightbox-widget', 'Lightbox Widget',
            'The widget in the lightbox',
            GObject.ParamFlags.READWRITE, Gtk.Widget),
        /**
         * Property: reveal-overlays
         * True if lightbox widget should be visible above main widget
         */
        'reveal-overlays': GObject.ParamSpec.boolean('reveal-overlays', 'Reveal Overlays',
            'True if lightbox widget should be visible above main widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: overlays-revealed
         * True if lightbox is revealed and animation target reached
         */
        'overlays-revealed': GObject.ParamSpec.boolean('overlays-revealed', 'Overlays Revealed',
            'True if lightbox is revealed and animation target reached',
            GObject.ParamFlags.READABLE, false),
        /**
         * Property: transition-duration
         * The duration of the animation of the overlays to visible/invisible
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration', 'Transition Duration',
            'The duration of the animation of the overlays to visible/invisible',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 250),
        /**
         * Property: has-close-button
         * True if the lightbox should have a close button to dismiss the overlay
         */
        'has-close-button':  GObject.ParamSpec.boolean('has-close-button', 'Has Close Button',
            'True if the lightbox should have a close button to dismiss the overlay. Default is true',
            GObject.ParamFlags.READWRITE, true),
        /**
         * Property: has-forward-button
         * Whether the forward button should be displayed
         */
        'has-forward-button': GObject.ParamSpec.boolean('has-forward-button',
            'Has Forward Button',
            'Boolean property to manage whether the lightbox\'s forward button should be shown. Defaults to true',
            GObject.ParamFlags.READWRITE, true),

        /**
         * Property: has-back-button
         * Whether the back button should be displayed
         */
        'has-back-button': GObject.ParamSpec.boolean('has-back-button',
            'Has Back Button',
            'Boolean property to manage whether the lightbox\'s back button should be shown. Defaults to true',
            GObject.ParamFlags.READWRITE, true)
    },
    Signals: {
        'navigation-previous-clicked': {},
        'navigation-next-clicked': {},
        'close-clicked': {},
    },

    _init: function (params) {
        // Property values
        this._lightbox_widget = null;
        this._reveal_overlays = false;
        this._transition_duration = 0;
        this._has_close_button = true;

        this._lightbox_container = new LightboxContainer();
        this._lightbox_container.connect('clicked',
            this._should_close.bind(this));
        this._lightbox_container.connect('close-clicked',
            this._should_close.bind(this));

        this._revealer = new Gtk.Revealer({
            no_show_all: true,
            transition_type: Gtk.RevealerTransitionType.CROSSFADE
        });
        this._revealer.add(this._lightbox_container);
        this._revealer.connect('notify::child-revealed', Lang.bind(this, function () {
            if (!this._revealer.child_revealed)
                this._revealer.hide();
            this.notify('overlays-revealed');
        }));

        this.parent(params);

        this._lightbox_container.connect('navigation-previous-clicked',
            () => { this.emit('navigation-previous-clicked'); });
        this._lightbox_container.connect('navigation-next-clicked',
            () => { this.emit('navigation-next-clicked'); });

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
            this._lightbox_container.grab_focus();
        } else {
            this._revealer.reveal_child = false;
            this._lightbox_container.has_focus = false;
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
            this._lightbox_container.remove_lightbox_widget(this._lightbox_widget);
        this._lightbox_widget = v;
        if (this._lightbox_widget !== null)
            this._lightbox_container.add_lightbox_widget(this._lightbox_widget);
        this.notify('lightbox-widget');
    },

    get lightbox_widget () {
        return this._lightbox_widget;
    },

    set transition_duration (v) {
        if (this._transition_duration === v)
            return;
        this._transition_duration = v;
        this.notify('transition-duration');
    },

    get transition_duration () {
        return this._transition_duration;
    },

    set has_close_button (v) {
        if (this._has_close_button === v)
            return;
        this._has_close_button = v;
        this._lightbox_container.close_visible = v;
        this.notify('has-close-button');
    },

    get has_close_button () {
        return this._has_close_button;
    },

    set has_forward_button (v) {
        if (this._lightbox_container.forward_arrow_visible === v)
            return;
        this._lightbox_container.forward_arrow_visible = v;
        this.notify('has-forward-button');
    },

    get has_forward_button () {
        return this._lightbox_container.forward_arrow_visible;
    },

    set has_back_button (v) {
        if (this._lightbox_container.back_arrow_visible === v)
            return;
        this._lightbox_container.back_arrow_visible = v;
        this.notify('has-back-button');
    },

    get has_back_button () {
        return this._lightbox_container.back_arrow_visible;
    },

    _should_close: function () {
        this.emit('close-clicked');
    },
});

// A private container used to house the lightbox-widget in the overlay.
const LightboxContainer = new Knowledge.Class({
    Name: 'LightboxContainer',
    Extends: Endless.CustomContainer,
    Signals: {
        'clicked': {},
        'close-clicked': {},
        'navigation-previous-clicked': {},
        'navigation-next-clicked': {}
    },

    _ICON_SIZE: 22,
    _MIN_BORDER: 20,

    _init: function (params) {
        params = params || {};
        params.can_focus = true;
        this.parent(params);

        this.close_visible = true;
        this.forward_arrow_visible = true;
        this.back_arrow_visible = true;
        this._lightbox_widget = null;

        this.set_events(Gdk.EventMask.BUTTON_PRESS_MASK | Gdk.EventMask.BUTTON_RELEASE_MASK | Gdk.EventMask.KEY_PRESS_MASK);
        this.set_has_window(true);
        this._frame_allocation = new Gdk.Rectangle();

        /**
         * Close button
         */
        let img_close = new Gtk.Image({
            icon_name: 'window-close-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this._close_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin_top: 5,
            margin_left: 15,
            image: img_close
        });
        Utils.set_hand_cursor_on_widget(this._close_button);
        this._close_button.connect('clicked', function () {
            this.emit('close-clicked');
        }.bind(this));

        /**
         * Navigate previous button
         */
        let img_prev = new Gtk.Image({
            icon_name: 'go-previous-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this._previous_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin: 20,
            image: img_prev
        });
        Utils.set_hand_cursor_on_widget(this._previous_button);
        this._previous_button.connect('clicked', function () {
            this.emit('navigation-previous-clicked');
        }.bind(this));
        this._previous_button.get_style_context().add_class(Utils.get_element_style_class(Lightbox, 'navigationPrevious'));

        /**
         * Navigate next button
         */
        let img_next = new Gtk.Image({
            icon_name: 'go-next-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this._next_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin: 20,
            image: img_next
        });
        Utils.set_hand_cursor_on_widget(this._next_button);
        this._next_button.connect('clicked', function () {
            this.emit('navigation-next-clicked');
        }.bind(this));
        this._next_button.get_style_context().add_class(Utils.get_element_style_class(Lightbox, 'navigationNext'));

        this.add(this._close_button);
        this.add(this._next_button);
        this.add(this._previous_button);

        this.connect('button-release-event', Lang.bind(this, this._button_release));
        this.connect('key-press-event', function (widget, event) {
            let [success, keyval] = event.get_keyval();
            if (!success)
                return false;
            if (keyval === Gdk.KEY_Left && this.back_arrow_visible) {
                this.emit('navigation-previous-clicked');
            } else if (keyval === Gdk.KEY_Right &&  this.forward_arrow_visible) {
                this.emit('navigation-next-clicked');
            } else if (keyval === Gdk.KEY_Escape) {
                this.emit('close-clicked');
            }
            return true;
        }.bind(this));
        this.show_all();
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
        let window = EosKnowledgePrivate.private_new_input_output_window(this);
        this.set_window(window);
        this.register_window(window);
    },

    vfunc_draw: function (cr) {
        let context = this.get_style_context();

        context.save();
        let shadow_class = Utils.get_element_style_class(Lightbox, 'shadow');
        context.add_class(shadow_class);
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        Gtk.render_background(context, cr, 0, 0, width, height);
        Gtk.render_frame(context, cr, 0, 0, width, height);
        context.restore();

        let ret = this.parent(cr);
        cr.$dispose();
        return ret;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        if (this.get_realized())
            this.get_window().move_resize(alloc.x, alloc.y,
                                          alloc.width, alloc.height);

        if (this._lightbox_widget === null)
            return;

        let content_width = this._lightbox_widget.get_preferred_width()[1];
        let content_height = this._lightbox_widget.get_preferred_height_for_width(content_width)[1];
        let close_width = this._MIN_BORDER;
        let close_height = this._MIN_BORDER;
        if (this.close_visible) {
            close_width = this._close_button.get_preferred_width()[1];
            close_height = this._close_button.get_preferred_height()[1];
        }
        let arrow_width = this._MIN_BORDER;
        let arrow_height = this._MIN_BORDER;
        if (this.back_arrow_visible || this.forward_arrow_visible) {
            arrow_height = Math.max(this._previous_button.get_preferred_height()[1],
                                    this._next_button.get_preferred_height()[1]);
            arrow_width = Math.max(this._previous_button.get_preferred_width()[1],
                                   this._next_button.get_preferred_width()[1]);
        }

        let available_inner_width = alloc.width - 2 * close_width;
        let available_inner_height = alloc.height - 2 * arrow_width;
        content_width = Math.min(available_inner_width, content_width);
        content_height = Math.min(available_inner_height, content_height);

        // Frame allocation is what all other allocation will be based on, it
        // is the allocation of the white box, containing the info and content
        // widgets
        this._frame_allocation = new Gdk.Rectangle({
            width: content_width,
            height: content_height,
        });
        this._frame_allocation.x = alloc.x + (alloc.width - this._frame_allocation.width) / 2;
        this._frame_allocation.y = alloc.y + (alloc.height - this._frame_allocation.height) / 2;

        // Content widget should be centered in the top of the frame.
        let content_alloc = new Gdk.Rectangle({
            x: this._frame_allocation.x + (this._frame_allocation.width - content_width) / 2,
            y: this._frame_allocation.y,
            width: content_width,
            height: content_height,
        });
        this._lightbox_widget.size_allocate(content_alloc);

        if (this.close_visible) {
            this._close_button.set_child_visible(true);
            // Close button will appear at the right top of the frame
            let close_alloc = new Gdk.Rectangle({
                x: this._frame_allocation.x + this._frame_allocation.width,
                y: this._frame_allocation.y,
                width: close_width,
                height: close_height
            });
            this._close_button.size_allocate(close_alloc);
        } else {
            this._close_button.set_child_visible(false);
        }

        if (this.forward_arrow_visible || this.back_arrow_visible) {
            // Our arrow appear centered underneath the frame
            let arrow_alloc = new Gdk.Rectangle({
                x: alloc.x + (alloc.width - arrow_width * 2) / 2,
                y: this._frame_allocation.y + this._frame_allocation.height,
                width: arrow_width,
                height: arrow_height
            });
            this._previous_button.size_allocate(arrow_alloc);
            arrow_alloc.x += arrow_width;
            this._next_button.size_allocate(arrow_alloc);
        }
        this._next_button.set_child_visible(this.forward_arrow_visible);
        this._previous_button.set_child_visible(this.back_arrow_visible);
    },

    add_lightbox_widget: function (widget) {
        this._lightbox_widget = widget;
        this.add(this._lightbox_widget);
    },

    remove_lightbox_widget: function () {
        this.remove(this._lightbox_widget);
        this._lightbox_widget = null;
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
        if (event_x >= this._frame_allocation.x &&
            event_y >= this._frame_allocation.y &&
            event_x <= this._frame_allocation.x + this._frame_allocation.width &&
            event_y <= this._frame_allocation.y + this._frame_allocation.height)
            return;

        // Event must have been in the shadowed area of the container.
        this.emit('clicked');
    }
});
