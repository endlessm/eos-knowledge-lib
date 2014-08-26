const EvinceDocument = imports.gi.EvinceDocument;
const EvinceView = imports.gi.EvinceView;
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

/**
 * Class: EvinceWebviewAdapter
 * Adapter to fit *EvinceView.View* into <WebviewSwitcherView>
 *
 * This class adapts an *EvinceView.View* object to implement certain parts of
 * the *WebKit2.WebView* interface as described in
 * <WebviewSwitcherView.create-view-for-file>.
 *
 * Parent class:
 *   Gtk.ScrolledWindow
 */
const EvinceWebviewAdapter = new Lang.Class({
    Name: 'EknEvinceWebviewAdapter',
    Extends: Gtk.ScrolledWindow,
    Signals: {
        /**
         * Event: load-changed
         * Monitor progress of document load
         *
         * This is emitted with values from <WebKit2.LoadEvent at
         * http://webkitgtk.org/reference/webkit2gtk/stable/WebKitWebView.html#WebKitLoadEvent>
         * whenever the load status of the document changes.
         * See the documentation for <load-changed at
         * http://webkitgtk.org/reference/webkit2gtk/stable/WebKitWebView.html#WebKitWebView-load-changed>.
         *
         * Return type:
         *   WebKit2.LoadEvent
         */
        'load-changed': {
            param_types: [ WebKit2.LoadEvent.$gtype ]
        },
        /**
         * Event: decide-policy
         * Decide about policies for following links
         *
         * This is emitted when the document requests the API user to make a
         * policy decision, such as whether to follow a link to a new document.
         * See the documentation for <decide-policy at
         * http://webkitgtk.org/reference/webkit2gtk/stable/WebKitWebView.html#WebKitWebView-decide-policy>.
         *
         * Return *true* to indicate that a decision has been made, *false*
         * to indicate that other handlers and eventually the default handler
         * should be invoked.
         *
         * Parameters:
         *   decision - an object mimicking <WebKit2.PolicyDecision at
         *     http://webkitgtk.org/reference/webkit2gtk/stable/WebKitPolicyDecision.html>
         *   type - a value from <WebKit2.PolicyDecisionType at
         *     http://webkitgtk.org/reference/webkit2gtk/stable/WebKitWebView.html#WebKitPolicyDecisionType>
         *
         * Return value:
         *   boolean
         *
         * Flags:
         *   run last
         */
        'decide-policy': {
            param_types: [
                GObject.TYPE_OBJECT /* WebKitPolicyDecision */,
                WebKit2.PolicyDecisionType.$gtype
            ],
            return_type: GObject.TYPE_BOOLEAN,
            flags: GObject.SignalFlags.RUN_LAST
        }
    },

    // Mimic WebKitLoadEvent enum.
    _LOAD_STARTED: 0,
    _LOAD_COMMITTED: 2,
    _LOAD_FINISHED: 3,

    _init: function () {
        this.parent();
        this._view = new EvinceView.View();
        this.add(this._view);
    },

    _load_evince_document: function (uri) {
        let evince_document =
            EvinceDocument.Document.factory_get_document(uri,
                EvinceDocument.DocumentLoadFlags.NONE, null);

        let document_model = new EvinceView.DocumentModel({
            document: evince_document
        });

        this._view.set_model(document_model);
    },

    /**
     * Method: load_uri
     * Load a new Evince document by its URI
     *
     * Requests loading of the specified URI string.
     * The URI should point to a document that Evince can display.
     *
     * Throws an exception if the document cannot be loaded.
     *
     * Parameters:
     *   uri - URI to load (string)
     */
    load_uri: function (uri) {
        this.emit('load-changed', this._LOAD_STARTED);
        try {
            this._load_evince_document(uri);
            this.emit('load-changed', this._LOAD_COMMITTED);
        } finally {
            this.emit('load-changed', this._LOAD_FINISHED);
        }
    },
});
