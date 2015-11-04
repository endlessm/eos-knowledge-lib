// Copyright 2015 Endless Mobile, Inc.

/* exported WebviewTooltipPresenter */

const cairo = imports.gi.cairo; // note: GI module, not native GJS module
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Compat = imports.app.compat.compat;
const Config = imports.app.config;
const Engine = imports.search.engine;
const Utils = imports.app.utils;
const WebviewTooltip = imports.app.widgets.webviewTooltip;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const DBUS_TOOLTIP_INTERFACE = '\
    <node> \
        <interface name="com.endlessm.Knowledge.TooltipCoordinates"> \
            <method name="GetCoordinates"> \
                <arg name="pointer_coordinates" type="(uu)" direction="in"/> \
                <arg name="dom_element_rectangle" type="(uuuu)" direction="out"/> \
            </method> \
        </interface> \
    </node>';

/**
 * Class: WebviewTooltipPresenter
 * A handler for the webview tooltip widget
 *
 * The WebviewTooltipPresenter handles the connection of the webview tooltip to
 * be added to a particular document card.
 */
const WebviewTooltipPresenter = new GObject.Class({
    Name: 'WebviewTooltipPresenter',
    GTypeName: 'EknWebviewTooltipPresenter',

    _init: function (props={}) {
        this.parent(props);

        this._dbus_name = Utils.get_web_plugin_dbus_name();
    },

    connect_tooltip_to_card: function (document_card, article_models, default_tooltip_type) {
        // Sets up the array of article models
        this._article_models = article_models || [];
        // Sets up the default tooltip type
        this._default_tooltip_type = default_tooltip_type;

        document_card.content_view.connect('mouse-target-changed', (view, hit_test) => {
            if (!hit_test.context_is_link()) {
                this._remove_link_tooltip();
                return;
            }
            let uri = Compat.normalize_old_browser_urls(hit_test.link_uri);
            // Links to images within the database will open in a lightbox
            // instead. This is determined in the HTML by the eos-image-link
            // class, but we don't have access to that information here.
            if (hit_test.context_is_image() && uri.startsWith('ekn://')) {
                this._remove_link_tooltip();
                return;
            }
            let mouse_position = this._get_mouse_coordinates(view);

            // Wait for the DBus interface to appear on the bus
            let watch_id = Gio.DBus.watch_name(Gio.BusType.SESSION,
                this._dbus_name, Gio.BusNameWatcherFlags.NONE,
                (connection) => {
                    let webview_object_path = Utils.dbus_object_path_for_webview(view);
                    let ProxyConstructor =
                        Gio.DBusProxy.makeProxyWrapper(DBUS_TOOLTIP_INTERFACE);
                    let proxy = new ProxyConstructor(connection,
                        this._dbus_name, webview_object_path);
                    proxy.GetCoordinatesRemote(mouse_position, (coordinates, error) => {
                        // Fall back to just popping up the tooltip at the
                        // mouse's position if there was an error.
                        if (error)
                            coordinates = [[mouse_position[0],
                                mouse_position[1], 1, 1]];
                        this._setup_link_tooltip(view, uri, coordinates[0]);
                        Gio.DBus.unwatch_name(watch_id);
                    });
                },
                null  // do nothing when name vanishes
            );
        });
    },

    _setup_link_tooltip: function (view, uri, coordinates) {
        let filtered_indices = [];
        let filtered_models = this._article_models.filter((model, index) => {
            if (model.ekn_id === uri)
                filtered_indices.push(index);
            return (model.ekn_id === uri);
        });

        // If a model is filtered by the uri, it means it's an in-issue article.
        if (filtered_models.length > 0) {
            // We expect to have one article model that matches the given uri,
            // hence we obtain the first filtered model and first matched index.
            // Note: The page number argument is incremented by two, to account
            // for the 0-base index and the overview page.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_IN_ISSUE_LINK,
                filtered_models[0].title, filtered_indices[0] + 2);
        } else if (GLib.uri_parse_scheme(uri) === 'ekn') {
            // If there is no filtered model but the uri has the "ekn://" prefix,
            // it's an archive article.
            Engine.get_default().get_object_by_id(uri,
                                                  null,
                                                  (engine, task) => {
                let article_model;
                try {
                    article_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not get article model');
                    return;
                }
                this._display_link_tooltip(view, coordinates, this._default_tooltip_type,
                    article_model.title, 0);
            });
        } else if (GLib.uri_parse_scheme(uri) === 'file' && uri.indexOf('/licenses/') > -1) {
            // If the uri has the "file://" scheme and it includes a segments for "licenses",
            // it corresponds to a license file, and we should display it as an external link.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_EXTERNAL_LINK,
                _("View the license in your browser"), 0);
        } else {
            // Otherwise, it's an external link. The URI is displayed as the title.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_EXTERNAL_LINK,
                uri, 0);
        }
    },

    _display_link_tooltip: function (view, coordinates, tooltip_type, tooltip_title, page_number) {
        this._remove_link_tooltip();
        this._link_tooltip = new WebviewTooltip.WebviewTooltip({
            type: tooltip_type,
            title: tooltip_title,
            page_number: page_number,
            relative_to: view,
            pointing_to: new cairo.RectangleInt({
                x: coordinates[0],
                y: coordinates[1],
                width: coordinates[2],
                height: coordinates[3],
            }),
        });
        this._link_tooltip.connect('leave-notify-event', () => {
            this._remove_link_tooltip();
        });
        this._link_tooltip.show_all();
    },

    _remove_link_tooltip: function () {
        if (this._link_tooltip) {
            this._link_tooltip.destroy();
            this._link_tooltip = null;
        }
    },

    _get_mouse_coordinates: function (view) {
        let display = Gdk.Display.get_default();
        let device_man = display.get_device_manager();
        let device = device_man.get_client_pointer();
        let [win, x, y, mask] = view.window.get_device_position(device);
        return [x, y];
    },
});
