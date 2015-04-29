const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

let SearchProvider = imports.search.searchProvider;

let Application = new Lang.Class({
    Name: 'EknSearchProviderApplication',
    Extends: Gio.Application,

    _init: function() {
        this.parent({ application_id: 'com.endlessm.EknSearchProvider',
                      flags: Gio.ApplicationFlags.IS_SERVICE,
                      inactivity_timeout: 12000 });

        this._search_provider = new SearchProvider.GlobalSearchProvider();
    },

    vfunc_dbus_register: function(connection, path) {
        this.parent(connection, path);
        this._search_provider.register(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function(connection, path) {
        this.parent(connection, path);
        this._search_provider.unregister(connection);
    },
});

let app = new Application();
app.run(['ekn-search-provider'].concat(ARGV));
