const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const MockWebview = new Lang.Class({
    Name: 'MockWebview',
    Extends: Gtk.Label,
    Signals: {
        'load-changed': {
            param_types: [ GObject.TYPE_INT /* WebKitLoadEvent */ ]
        },
        'decide-policy': {
            return_type: GObject.TYPE_BOOLEAN,
            param_types: [
                GObject.TYPE_OBJECT /* WebKitPolicyDecision */,
                GObject.TYPE_INT /* WebKitPolicyDecisionType */
            ],
            flags: GObject.SignalFlags.RUN_LAST
        }
    },

    // Mimic WebKitLoadEvent enum
    STARTED: 0,
    COMMITTED: 2,
    FINISHED: 3,

    load_uri: function (uri) {
        this.uri = uri;
        GLib.idle_add(GLib.PRIORITY_HIGH_IDLE, function () {
            this.emit('load-changed', this.STARTED);
            this.emit('load-changed', this.COMMITTED);
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50 /* ms */, function () {
                this.emit('load-changed', this.FINISHED);
                return false;  // G_SOURCE_REMOVE
            }.bind(this));
            return false;  // G_SOURCE_REMOVE
        }.bind(this));
    }
});
