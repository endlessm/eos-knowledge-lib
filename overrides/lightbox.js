const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CompositeButton = imports.compositeButton;
const MediaObjectModel = imports.mediaObjectModel;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Lightbox
 * Show widget in a lightbox above other content
 *
 * EosKnowledge.Lightbox is a container which allows displaying a
 * <content-widget> above some other base content. The base content
 * should be added with lightbox.add().
 *
 * An optional <infobox-widget> can also be added, in a infobox panel
 * underneath the <content-widget> widget.
 *
 * To show or hide both of these widgets above the main content, set the
 * <reveal-overlays> property. The lightbox will animate the content visible
 * and invisible and update the <overlays-revealed> property when the
 * animation is complete.
 *
 * You need to call show() on both the <content-widget> and <infobox-widget>
 * before adding them to the lightbox. To respect the <reveal-overlays>
 * property show_all() will not work on the widget overlays.
 */
const Lightbox = new Lang.Class({
    Name: 'Lightbox',
    GTypeName: 'EknLightbox',
    Extends: Gtk.Overlay,
    Properties: {
        /**
         * Property: media-object
         * The <MediaObjectModel> being previewed.
         */
        'media-object': GObject.ParamSpec.object('media-object',
            'Media Object', 'The media object being previewed',
            GObject.ParamFlags.READWRITE, MediaObjectModel.MediaObjectModel),
        /**
         * Property: content-widget
         * The widget to display centered in the lightbox above the base content
         */
        'content-widget': GObject.ParamSpec.object('content-widget', 'Lightbox Widget',
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
            0, GLib.MAXUINT32, 250),
        /**
         * Property: has-close-button
         * True if the lightbox should have a close button to dismiss the overlay
         */
        'has-close-button':  GObject.ParamSpec.boolean('has-close-button', 'Has Close Button',
            'True if the lightbox should have a close button to dismiss the overlay. Default is true',
            GObject.ParamFlags.READWRITE, true),
        /**
         * Property: has-navigation-buttons
         * Whether the navigation buttons should be displayed
         */
        'has-navigation-buttons': GObject.ParamSpec.boolean('has-navigation-buttons',
            'Has Navigation Buttons',
            'Boolean property to manage whether the lightbox\'s navigation buttons should be shown. Defaults to true',
            GObject.ParamFlags.READWRITE, true)
    },
    Signals: {
        'navigation-previous-clicked': { param_types: [ GObject.TYPE_OBJECT ] },
        'navigation-next-clicked': { param_types: [ GObject.TYPE_OBJECT ] }
    },

    _init: function (params) {
        // Property values
        this._media_object = null;
        this._content_widget = null;
        this._infobox_widget = null;
        this._reveal_overlays = false;
        this._transition_duration = 0;
        this._has_close_button = true;
        this._has_navigation_buttons = true;

        this._lightbox_container = new LightboxContainer();
        this._lightbox_container.connect('clicked', Lang.bind(this, function () {
            this.reveal_overlays = false;
        }));
        this._lightbox_container.connect('close-clicked', Lang.bind(this, function () {
            this.reveal_overlays = false;
        }));

        let inner_overlay = new Gtk.Overlay();
        inner_overlay.add(this._lightbox_container);
        inner_overlay.show_all();

        this._revealer = new Gtk.Revealer({
            no_show_all: true,
            transition_type: Gtk.RevealerTransitionType.CROSSFADE
        });
        this._revealer.add(inner_overlay);
        this._revealer.connect('notify::child-revealed', Lang.bind(this, function () {
            if (!this._revealer.child_revealed)
                this._revealer.hide();
            this.notify('overlays-revealed');
        }));

        this.parent(params);

        this._lightbox_container.close_button.set_visible(this._has_close_button);
        this._lightbox_container.navigation_box.set_visible(this._has_navigation_buttons);

        this._lightbox_container.connect('navigation-previous-clicked',
            Lang.bind(this, function () {
                this.emit('navigation-previous-clicked', this._media_object);
        }));
        this._lightbox_container.connect('navigation-next-clicked',
            Lang.bind(this, function () {
                this.emit('navigation-next-clicked', this._media_object);
        }));

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX);
        this.bind_property('transition-duration',
                           this._revealer, 'transition-duration',
                           GObject.BindingFlags.SYNC_CREATE);
        this.add_overlay(this._revealer);
    },

    set media_object (v) {
        if (this._media_object !== null && this._media_object.content_uri === v.content_uri)
            return;
        this._media_object = v;
    },

    get media_object () {
        return this._media_object;
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

    set content_widget (v) {
        if (this._content_widget === v)
            return;
        if (this._content_widget !== null)
            this._lightbox_container.remove_widget(this._content_widget);
        this._content_widget = v;
        if (this._content_widget !== null)
            this._lightbox_container.attach_widget(this._content_widget);
        this.notify('content-widget');
    },

    get content_widget () {
        return this._content_widget;
    },

    set infobox_widget (v) {
        if (this._infobox_widget === v)
            return;
        if (this._infobox_widget !== null)
            this._lightbox_container.remove_info_widget(this._infobox_widget);
        this._infobox_widget = v;
        this._infobox_widget.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INFOBOX);

        if (this._infobox_widget !== null)
            this._lightbox_container.add_info_widget(this._infobox_widget);
        this.notify('infobox-widget');
    },

    get infobox_widget () {
        return this._infobox_widget;
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
        this._lightbox_container.close_button.set_visible(this._has_close_button);
        this.notify('has-close-button');
    },

    get has_close_button () {
        return this._has_close_button;
    },

    set has_navigation_buttons (v) {
        if (this._has_navigation_buttons === v)
            return;
        this._has_navigation_buttons = v;
        this._lightbox_container.navigation_box.set_visible(this._has_navigation_buttons);
        this.notify('has-navigation-buttons');
    },

    get has_navigation_buttons () {
        return this._has_navigation_buttons;
    }
});

// A private container used to house the lightbox-widget in the overlay.
const LightboxContainer = new Lang.Class({
    Name: 'LightboxContainer',
    GTypeName: 'EknLightboxContainer',
    Extends: Gtk.Alignment,
    Signals: {
        'clicked': {},
        'close-clicked': {},
        'navigation-previous-clicked': {},
        'navigation-next-clicked': {}
    },

    _ICON_SIZE: 24,
    _ICON_MARGIN: 10,

    _init: function (params) {
        params = params || {};
        params.xscale = 0.0;
        params.yscale = 0.0;
        this.parent(params);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX_SHADOW);
        this.set_events(Gdk.EventMask.BUTTON_PRESS_MASK | Gdk.EventMask.BUTTON_RELEASE_MASK);
        this.set_has_window(true);

        /**
         * Grid that contains the buttons needed for the UI, as well as the lightbox's content
         */
        this._container_grid = new Gtk.Grid({
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER
        });

        /**
         * Grid that contains the main widget to be displayed, along with attribution
         * information
         */
        this.lightbox_main_container = new Gtk.Grid({
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.VERTICAL
        });

        this._container_frame = new Gtk.Frame();
        this._container_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX_CONTAINER);
        this._container_frame.add(this.lightbox_main_container);

        /**
         * Close button
         */
        let img_close = new Gtk.Image({
            icon_name: 'window-close-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this.close_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin: this._ICON_MARGIN,
            image: img_close
        });
        this.close_button.connect('clicked', function () {
            this.emit('close-clicked');
        }.bind(this));

        // Dummy widget used to center main content in screen
        // We bind its 'visible' property so that its visibility is in sync
        // with the close button visibility
        let spacer = new Gtk.Frame();
        spacer.bind_property(
            'visible',
            this.close_button, 'visible',
            GObject.BindingFlags.BIDIRECTIONAL
        );

        /**
         * Size Group to enforce centering of main content widget
         */
        this._lightbox_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL
        });
        this._lightbox_size_group.add_widget(spacer);
        this._lightbox_size_group.add_widget(this.close_button);

        /**
         * Navigate previous button
         */
        let img_prev = new Gtk.Image({
            icon_name: 'go-previous-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this._navigation_previous_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin: this._ICON_MARGIN,
            image: img_prev
        });
        this._navigation_previous_button.connect('clicked', function () {
            this.emit('navigation-previous-clicked');
        }.bind(this));
        this._navigation_previous_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX_NAVIGATION_BUTTON);

        /**
         * Navigate next button
         */
        let img_next = new Gtk.Image({
            icon_name: 'go-next-symbolic',
            pixel_size: this._ICON_SIZE
        });
        this._navigation_next_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            margin: this._ICON_MARGIN,
            image: img_next
        });
        this._navigation_next_button.connect('clicked', function () {
            this.emit('navigation-next-clicked');
        }.bind(this));
        this._navigation_next_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_LIGHTBOX_NAVIGATION_BUTTON);

        /**
         * Navigation Button Box
         */
        this.navigation_box = new Gtk.Grid({
            hexpand: false,
            halign: Gtk.Align.CENTER
        });
        this.navigation_box.attach(this._navigation_previous_button, 0, 0, 1, 1);
        this.navigation_box.attach(this._navigation_next_button, 1, 0, 1, 1);

        this._container_grid.attach(spacer, 0, 0, 1, 1);
        this._container_grid.attach(this._container_frame, 1, 0, 1, 1);
        this._container_grid.attach(this.close_button, 2, 0, 1, 1);
        this._container_grid.attach(this.navigation_box, 0, 1, 3, 1);

        this.add(this._container_grid);

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

    attach_widget: function (w) {
        this._widget = w;
        // Added this to hide implementation detail
        this.lightbox_main_container.attach(this._widget, 0, 0, 1, 1);
    },

    add_info_widget: function (widget) {
        this.lightbox_main_container.attach(widget, 0, 1, 1, 1);
    },

    remove_info_widget: function (widget) {
        this.lightbox_main_container.remove_row(1);
    },

    remove_widget: function (w) {
        this._container_grid.remove(w);
        this._widget = null;
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
        // emit a clicked signal (the user clicked on the content-widget).
        if (event.get_window() !== this.get_window())
            return;
        // Not all child widgets will have their own GdkWindows capturing
        // mouse events. If event is generated inside child widgets allocation
        // return.
        if (this._widget) {
            let child_alloc = this._widget.get_allocation();
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
