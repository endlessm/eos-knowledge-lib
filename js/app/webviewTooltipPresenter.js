// Copyright 2015 Endless Mobile, Inc.

/* exported WebviewTooltipPresenter */

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

const DBUS_TOOLTIP_INTERFACE = '\
    <node> \
        <interface name="com.endlessm.Knowledge.TooltipCoordinates"> \
            <method name="GetCoordinates"> \
                <arg name="pointer_coordinates" type="(uu)" direction="in"/> \
                <arg name="dom_element_rectangle" type="(uuuu)" direction="out"/> \
            </method> \
        </interface> \
    </node>';
const WEBVIEW_OBJECT_PATH = '/com/endlessm/webview';

/**
 * Class: WebviewTooltipPresenter
 * A handler for the webview tooltip widget
 *
 * The WebviewTooltipPresenter handles the connection of the webview tooltip to
 * be added to a particular document card.
 */
var WebviewTooltipPresenter = new Knowledge.Class({
    Name: 'WebviewTooltipPresenter',
    Extends: GObject.Object,

    Signals: {
        'show-tooltip': {
            param_types: [Gtk.Popover, GObject.TYPE_STRING],
            return_type: GObject.TYPE_BOOLEAN,
            flags: GObject.SignalFlags.RUN_LAST,
            accumulator: GObject.AccumulatorType.TRUE_HANDLED,
        },
    },

    _init: function (props={}) {
        this.parent(props);
    },

    set_document_card: function (document_card) {
        document_card.content_view.connect('mouse-target-changed', (view, hit_test) => {
            if (!hit_test.context_is_link() || hit_test.link_uri.match(/^ekn:\/\/.*#/)) {
                this._remove_link_tooltip();
                return;
            }
            // Links to images within the database will open in a lightbox
            // instead. This is determined in the HTML by the eos-image-link
            // class, but we don't have access to that information here.
            if (hit_test.context_is_image() && hit_test.link_uri.startsWith('ekn://')) {
                this._remove_link_tooltip();
                return;
            }
            let mouse_position = this._get_mouse_coordinates(view);

            // Wait for the DBus interface to appear on the bus
            let dbus_name = Utils.get_web_plugin_dbus_name_for_webview(view);
            let watch_id = Gio.DBus.watch_name(Gio.BusType.SESSION,
                dbus_name, Gio.BusNameWatcherFlags.NONE,
                (connection, name, owner) => {
                    let ProxyConstructor = Gio.DBusProxy.makeProxyWrapper(DBUS_TOOLTIP_INTERFACE);
                    let proxy = new ProxyConstructor(connection, dbus_name, WEBVIEW_OBJECT_PATH);
                    proxy.GetCoordinatesRemote(mouse_position, (coordinates, error) => {
                        // Fall back to just popping up the tooltip at the
                        // mouse's position if there was an error.
                        if (error) {
                            coordinates = [[mouse_position[0],
                                mouse_position[1], 1, 1]];
                            logError(error, 'No tooltip coordinates');
                        }
                        this._display_link_tooltip(view, coordinates[0], hit_test.link_uri);
                        Gio.DBus.unwatch_name(watch_id);
                    });
                },
                null // do nothing when name vanishes
            );
        });
    },

    show_external_link_tooltip: function (tooltip, uri) {
        let builder = this._get_widget_builder();
        let contents = builder.get_object('WebviewTooltipExternalLink');

        let title_label = builder.get_object('link-label');
        title_label.label = uri;

        tooltip.add(contents);
        tooltip.show_all();
    },

    show_license_tooltip: function (tooltip) {
        let builder = this._get_widget_builder();
        let contents = builder.get_object('WebviewTooltipLicense');

        tooltip.add(contents);
        tooltip.show_all();
    },

    show_default_tooltip: function (tooltip, title) {
        let builder = this._get_widget_builder();
        let contents = builder.get_object('WebviewTooltipDefault');
        contents.label = title;

        tooltip.add(contents);
        tooltip.show_all();
    },

    _get_widget_builder: function () {
        return Gtk.Builder.new_from_resource('/com/endlessm/knowledge/data/widgets/tooltips.ui');
    },

    _get_mouse_coordinates: function (view) {
        let display = Gdk.Display.get_default();
        let device_man = display.get_device_manager();
        let device = device_man.get_client_pointer();
        let [win, x, y, mask] = view.window.get_device_position(device);
        return [x, y];
    },

    _remove_link_tooltip: function () {
        if (this._link_tooltip) {
            this._link_tooltip.hide();
            this._link_tooltip.destroy();
            this._link_tooltip = null;
        }
    },

    _display_link_tooltip: function (view, coordinates, uri) {
        this._remove_link_tooltip();

        this._link_tooltip = new Gtk.Popover({
            relative_to: view,
            pointing_to: new Gdk.Rectangle({
                x: coordinates[0],
                y: coordinates[1],
                width: coordinates[2],
                height: coordinates[3],
            }),
            modal: false,
        });
        this._link_tooltip.get_style_context().add_class('WebviewTooltip');
        if (!this.emit('show-tooltip', this._link_tooltip, uri))
            this._remove_link_tooltip();
    },
});
