const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

var ShareActionBox = new Knowledge.Class({
    Name: 'ShareActionBox',
    Extends: Gtk.Box,

    _init: function (params) {
        this.parent(params);

        this._add_button(HistoryStore.Network.FACEBOOK, 'facebook-symbolic', 'facebook');
        this._add_button(HistoryStore.Network.TWITTER, 'twitter-symbolic', 'twitter');
        this._add_button(HistoryStore.Network.WHATSAPP, 'whatsapp-symbolic', 'whatsapp');
    },

    _add_button: function (network, icon_name, css_class) {
        let button = new Gtk.Button ({
            image: new Gtk.Image ({ icon_name: icon_name }),
        });

        button.get_style_context().add_class(css_class);
        Utils.set_hand_cursor_on_widget(button);
        button.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHARE,
                network: network
            });
        });

        this.add(button);
        button.show();
    },
});
