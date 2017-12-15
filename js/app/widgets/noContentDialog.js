// Copyright 2017 Endless Mobile, Inc.

/* exported NoContentDialog */

const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

/**
 * Class: NoContentDialog
 *
 * A dialog for handling cases where the content cannot be found
 */
var NoContentDialog = new Lang.Class({
    Name: 'NoContentDialog',
    Extends: Gtk.MessageDialog,

    Template: 'resource:///com/endlessm/knowledge/data/widgets/noContentDialog.ui',

    _init: function (props) {
        this.parent(props);
        this.connect('response', this._onResponse.bind(this));
    },

    _open_app_center_details: function (app_id) {
        let bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
        let param = new GLib.Variant('(ss)', [app_id, '']);
        let data = new GLib.Variant('a{sv}');
        let action = Gio.DBusActionGroup.get(bus, 'org.gnome.Software', '/org/gnome/Software')
        action.activate_action_full('details', param, data);
    },

    _onResponse: function (widget, response_id) {
        let application = Gio.Application.get_default();
        if (response_id === Gtk.ResponseType.OK) {
            this._open_app_center_details(application.application_id);
            this.close();
        }
        application.quit();
    },
});

