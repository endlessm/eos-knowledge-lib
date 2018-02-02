// Copyright 2017 Endless Mobile, Inc.

/* exported WebShareDialog */

const Config = imports.app.config;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Soup = imports.gi.Soup;
const Gettext = imports.gettext;
const WebKit2 = imports.gi.WebKit2;

const Lang = imports.lang;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/* Template needs WebView type */
GObject.type_ensure( WebKit2.WebView.$gtype);

const MsgResponse = {
    NONE: 0,
    SIGN_IN: 1
};

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
    InternalChildren: [ 'stack', 'overlay', 'webview', 'spinner', 'accountbox',
                        'infobar', 'msg_revealer', 'msg_label', 'msg_image', 'msg_buttonbox' ],

    _init (props) {
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
        } else {
            /* Based on facebook share dialog size */
            this.default_width = 550;
            this.default_height = 480;
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

        /* Handle infobar response */
        this._infobar.connect('response', this._onInfobarResponse.bind(this));

        /* Get GOA account for this.provider */
        this._update_goa_account();
    },

    _onLoadChanged (webview, event) {
        if (event == WebKit2.LoadEvent.STARTED)
            this._spinner.visible = this._spinner.active = true;
        else if (event == WebKit2.LoadEvent.FINISHED)
            this._spinner.visible = this._spinner.active = false;
    },

    _onDecidePolicy (webview, decision, decision_type) {
        if (this.redirect_uri &&
            decision_type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION &&
            GLib.str_has_prefix(decision.request.uri, this.redirect_uri)) {

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

    _ensure_control_center () {
        if (this._control_center)
            return;

        this._control_center = Gio.DBusActionGroup.get(
            this._dbus_manager.get_connection(),
            'org.gnome.ControlCenter',
            '/org/gnome/ControlCenter'
        );
    },

    _msgSet (message, button_label, response) {
        this._msg_label.set_markup(message);

        /* Remove all buttons */
        let action_area = this._infobar.get_action_area();
        action_area.get_children().forEach ((child) => {
            action_area.remove(child);
        });

        this._infobar.add_button(button_label, response);
    },

    _onInfobarResponse (infobar, response) {
        if (response === MsgResponse.SIGN_IN) {
            if (!this._goa_account)
                return;

            let attention = this._goa_account.get_cached_property('AttentionNeeded');
            let id = this._goa_account.get_cached_property('Id');

            if (attention && attention.unpack() && id) {
                let params = new GLib.Variant('(sav)', ['online-accounts', [id]]);
                this._ensure_control_center();
                this._control_center.activate_action('launch-panel', params);
                this._online_accounts_panel_launched = true;
            }
        } else if (response === Gtk.ResponseType.CLOSE) {
            this._msg_revealer.reveal_child = false;
            this._online_accounts_panel_launched = false;
            this._msg_image.icon_name = null;
            this._msg_image.hide();
            this._update_uri();
        }
    },

    _cookies_path_init () {
        let dir = GLib.dir_make_tmp('WebShareDialog-XXXXXX');

        if (dir)
            this._cookies_path = GLib.build_filenamev ([dir, 'cookies.sqlite']);
        else
            logError(new Error('Can not create tmp dir to share cookies with webview'));
    },

    _cookies_path_remove () {

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

    _webview_set_cookies (variant) {
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

    _attention_needed_sync () {
        if (!this._goa_account)
            return;

        let attention = this._goa_account.get_cached_property('AttentionNeeded');

        if (attention && attention.unpack()) {
            /* AttentionNeeded propably means the session has expired */
            this._overlay.width_request = -1;
            this._overlay.height_request = -1;

            /* Show expired session message */
            let message = _('Please sign in again to share this link');
            this._msgSet(`<b><big>${message}</big></b>`, _('Sign In'), MsgResponse.SIGN_IN);
            this._msg_image.icon_name = this.provider + '-symbolic';
            this._msg_image.show();
            this._msg_revealer.reveal_child = true;
        } else {
            /* Set webview uri */
            this._update_cookies();
            this._update_uri();

            /* Check if we launced online accounts panel, if so... close it */
            if (this._control_center && this._online_accounts_panel_launched) {
                this._control_center.activate_action('quit', null);
                this._infobar.response(Gtk.ResponseType.CLOSE);
            }
        }
    },

    _update_goa_account () {
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
                this._goa_oauth2 = this._goa_account = null;
            break;
            case 1:
                this._goa_oauth2 = accounts[0].get_interface('org.gnome.OnlineAccounts.OAuth2Based');
                this._goa_account = accounts[0].get_interface('org.gnome.OnlineAccounts.Account');
            break;
            default:
                /* TODO: Create a list of accounts and let the user choose which one to use
                 * in the meantime, use the first one!
                 */
                this._goa_oauth2 = accounts[0].get_interface('org.gnome.OnlineAccounts.OAuth2Based');
                this._goa_account = accounts[0].get_interface('org.gnome.OnlineAccounts.Account');
            break;
        }

        if (this._goa_account) {
            /* Listen to proxy properties changes */
            this._goa_account.connect('g-properties-changed', (proxy, props, invalid) => {
                let properties = props.deep_unpack();
                if ('AttentionNeeded' in properties)
                    this._attention_needed_sync();
            });

            this._attention_needed_sync();
        }
    },

    _update_cookies () {
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

    _update_uri () {
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

