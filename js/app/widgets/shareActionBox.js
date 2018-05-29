const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

var ShareActionBox = new Knowledge.Class({
    Name: 'ShareActionBox',
    Extends: Gtk.Box,

    Properties: {
        'pixel-size': GObject.ParamSpec.int('pixel-size',
            'Pixel size',
            'Icon pixel size',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT16, -1),
    },

    _init: function (params) {
        this.parent(params);

        this._add_button(HistoryStore.Network.FACEBOOK, 'facebook-symbolic', 'facebook');
        this._add_button(HistoryStore.Network.TWITTER, 'twitter-symbolic', 'twitter');
        this._add_button(HistoryStore.Network.WHATSAPP, 'whatsapp-symbolic', 'whatsapp');
    },

    _add_button: function (network, icon_name, css_class) {
        let button = new Gtk.Button ({ visible: true });
        let image = new Gtk.Image ({
            icon_name: icon_name,
            pixel_size: this.pixel_size,
            visible: true
        });

        button.add(image);
        button.get_style_context().add_class(css_class);
        Utils.set_hand_cursor_on_widget(button);
        button.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHARE,
                network: network
            });
        });

        this.add(button);
    },
});
