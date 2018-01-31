// Copyright 2017 Endless Mobile, Inc.

/* exported WebShareDialog */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Soup = imports.gi.Soup;
const WebKit2 = imports.gi.WebKit2;

const Lang = imports.lang;

/* Template needs WebView type */
GObject.type_ensure( WebKit2.WebView.$gtype);

/**
 * Class: WebShareDialog
 *
 * A dialog containing a webview with sessions cookies obtained from GOA
 */
var WebShareDialog = new Lang.Class({
    Name: 'WebShareDialog',
    Extends: Gtk.Dialog,

    Properties: {
        'provider': GObject.ParamSpec.string('provider',
            'Provider',
            'GOA provider type to use',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            null),

        'uri': GObject.ParamSpec.string('uri',
            'URI to load',
            'The URI to load in the webview',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            null),

        'redirect-uri': GObject.ParamSpec.string('redirect-uri',
            'Redirect URI',
            'The redirect URI to know when the operation ended',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            null),

        'mobile': GObject.ParamSpec.boolean('mobile',
            'Mobile user agent',
            'Use a mobile user agent for the webview',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),

        'manager': GObject.ParamSpec.object('manager', 'Manager',
            'DBus manager for dependency injection in tests',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    Signals: {
        /**
         * Signal: transaction-done
         * Emitted when the webview is redirected to redirect-uri
         *
         * Parameters:
         *   uri - the actual redirect uri including parameters
         */
        'transaction-done': {
            param_types: [ GObject.TYPE_STRING ],
        },
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/websharedialog.ui',
    InternalChildren: [ 'stack', 'overlay', 'webview', 'spinner', 'accountbox' ],

    _init: function (props) {
        this._provider = null;
        this._uri = null;
        this._actual_redirect_uri = null;

        /* Create an unique cookie path for this instance */
        this._cookies_path_init();

        /* Get GOA object manager */
        if (props.manager) {
            this._dbus_manager = props.manager;
        } else {
            this._dbus_manager = Gio.DBusObjectManagerClient.new_for_bus_sync(
                Gio.BusType.SESSION,
                Gio.DBusObjectManagerClientFlags.NONE,
                'org.gnome.OnlineAccounts',
                '/org/gnome/OnlineAccounts',
                null,
                null
            );
        }

        /* Assume GetSessionCookies is present.
         * It will be updated the first time we try to call it.
         */
        this._has_get_session_cookies = true;

        /* Chain Up */
        this.parent(props);

        if (this.mobile) {
            let settings = this._webview.get_settings();
            settings.set_user_agent("Mozilla/5.0 (EndlessOS not Android;) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile");

            /* Also use a mobile size */
            this.default_width = 320;
            this.default_height = 480;
        }
        else {
            /* Based on facebook share dialog size */
            this.default_width = 560;
            this.default_height = 600;
        }

        /* Bind WebView and Dialog title */
        this._webview.connect("notify::title", () => {
            this.title = this._webview.title;
        });

        /* Handle spinner */
        this._webview.connect('load-changed', this._onLoadChanged.bind(this));

        /* Handle redirect-uri transaction end */
        this._webview.connect('decide-policy', this._onDecidePolicy.bind(this));

        /* Remove cookies from disk */
        this.connect('delete-event', () => {
            /* Emit signal to let the user know the transaction ended */
            this.emit ('transaction-done', this._actual_redirect_uri);

            this._cookies_path_remove();
            return false;
        });

        /* Get GOA account for this.provider */
        this._update_goa_account();

        /* Set webview uri */
        this._update_uri();
    },

    _onLoadChanged: function (webview, event) {
        if (event == WebKit2.LoadEvent.STARTED)
            this._spinner.visible = this._spinner.active = true;
        else if (event == WebKit2.LoadEvent.FINISHED)
            this._spinner.visible = this._spinner.active = false;
    },

    _onDecidePolicy: function (webview, decision, decision_type) {
        if (this.redirect_uri &&
            decision_type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION &&
            decision.request.uri.startsWith(this.redirect_uri)) {

            /* Save actual redirect URI for transaction-done emision */
            this._actual_redirect_uri = decision.request.uri;

            /* Make sure we get rid of the webview */
            this._webview.destroy();

            /* And close the dialog */
            this.close();
            return true;
        }
        return false;
    },

    _cookies_path_init: function () {
        let dir = GLib.dir_make_tmp('WebShareDialog-XXXXXX');

        if (dir)
            this._cookies_path = GLib.build_filenamev ([dir, 'cookies.sqlite']);
        else
            logError(new Error('Can not create tmp dir to share cookies with webview'));
    },

    _cookies_path_remove: function () {

        if (!this._cookies_path)
            return;

        let info;
        let dirname = GLib.path_get_dirname(this._cookies_path);
        let dir = Gio.File.new_for_path(dirname);
        let iter = dir.enumerate_children('cookies.sqlite*',
                                          Gio.FileQueryInfoFlags.NONE,
                                          null);
        while ((info = iter.next_file(null)))
            GLib.unlink(iter.get_child(info).get_path());

        GLib.rmdir(dirname);
        delete this._cookies_path;
    },

    _webview_set_cookies: function (variant) {
        let retval = variant.get_child_value(0);
        let cookies = retval.deep_unpack();

        let jar = new Soup.CookieJarDB ({
            filename: this._cookies_path,
            read_only: false
        });

        cookies.forEach((c) => {
            /* deep_unpack() wont unpack variants */
            for (let key in c)
                c[key] = c[key].unpack();

            let cookie = new Soup.Cookie (c.name, c.value, c.domain, c.path, -1);

            /* Set extra parameters */
            cookie.set_expires(Soup.Date.new_from_time_t (c.expires));
            cookie.set_secure(c.secure);
            cookie.set_http_only(c.http_only);

            /* Add cookie to Jar */
            jar.add_cookie(cookie);
        });

        jar = null;

        /* Set WebView cookie manager persistent storage */
        let manager = this._webview.get_context().get_website_data_manager().get_cookie_manager();
        manager.set_persistent_storage(this._cookies_path,
                                       WebKit2.CookiePersistentStorage.SQLITE);
    },

    _update_goa_account: function () {
        if (!this._dbus_manager || !this._webview)
            return;

        let objects = this._dbus_manager.get_objects();
        let accounts = [];

        objects.forEach ((obj) => {
            let account = obj.get_interface('org.gnome.OnlineAccounts.Account');

            if (account) {
                let provider = account.get_cached_property('ProviderType');

                if (provider && provider.unpack() === this.provider)
                    accounts.push(obj);
            }
        });

        switch (accounts.length) {
            case 0:
                /* TODO: open GOA to create a new account */
            break;
            case 1:
                this._goa_oauth2 = accounts[0].get_interface('org.gnome.OnlineAccounts.OAuth2Based');
                this._update_cookies();
            break;
            default:
                /* TODO: Create a list of accounts and let the user choose which one to use
                 * in the meantime, use the first one!
                 */
                this._goa_oauth2 = accounts[0].get_interface('org.gnome.OnlineAccounts.OAuth2Based');
                this._update_cookies();
            break;
        }
    },

    _update_cookies: function () {
        if (!this._goa_oauth2)
            return;

        if (this._has_get_session_cookies) {
            try {
                let cookies = this._goa_oauth2.call_sync("GetSessionCookies", null, 0, -1, null);
                this._webview_set_cookies(cookies);
            } catch (error) {
                if (error.matches(Gio.DBusError, Gio.DBusError.UNKNOWN_METHOD))
                    this._has_get_session_cookies = false;
            }
        }

        if (!this._has_get_session_cookies) {
            /* GetSessionCookies is not suported (We are not running in EOS) */
            /* TODO: store cookies in libsecret and implement login here???? */
        }
    },

    _update_uri: function () {
        if (!this._webview)
            return;

        if (this._uri)
            this._webview.load_uri(this._uri);
        else
            this._webview.stop_loading();
    },

    get provider () {
        return this._provider;
    },

    set provider (value) {
        if (this._provider === value)
            return;

        this._provider = value;
        this._update_goa_account();

        this.notify('provider');
    },

    get uri () {
        return this._uri;
    },

    set uri (value) {
        if (this._uri === value)
            return;

        this._uri = value;
        this._update_uri();

        this.notify('uri');
    },
});

