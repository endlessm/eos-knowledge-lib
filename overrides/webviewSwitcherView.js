/* Copyright 2014 Endless Mobile, Inc. */
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: WebviewSwitcherView
 * View that slides views on top of one another
 *
 * This class proxies a WebKit2.WebView (or any other object that has
 * "load-changed" and "decide-policy" signals in its interface).
 * It is used to create a "paging" effect in a browser-type environment.
 * Calling <load_uri()> causes a new view to be created and slide in on top
 * of the previous view, which is then destroyed in order to save memory.
 *
 * TODO: Rename to ViewSwitcherView since this class now displays more than just
 * webviews.
 *
 * Parent class:
 *    Gtk.Stack
 */
const WebviewSwitcherView = new Lang.Class({
    Name: 'WebviewSwitcherView',
    GTypeName: 'EknWebviewSwitcherView',
    Extends: Gtk.Stack,
    Signals: {
        /**
         * Event: create-webview
         * Request creation of a web view to put into this view
         *
         * This signal is emitted when this view is about to load a new page.
         * The signal handler should return a Gtk.Widget.
         * If it returns null, then the next handler will be invoked for this
         * signal, and eventually the default handler.
         *
         * The default handler for this signal does the equivalent of
         * > return new WebKit2.WebView();
         *
         * Return type:
         *   Gtk.Widget
         *
         * Flags:
         *   run last
         *
         * Deprecated:
         *   Use <create-view-for-file> instead. (Since version 0.2)
         */
        'create-webview': {
            return_type: Gtk.Widget.$gtype,
            flags: GObject.SignalFlags.RUN_LAST |
                GObject.SignalFlags.DEPRECATED,
            accumulator: GObject.AccumulatorType.FIRST_WINS
        },
        /**
         * Event: create-view-for-file
         * Request creation of a view to put into this view.
         *
         * This signal is emitted when this view is about to load a new page.
         * The signal handler should return a widget, which must implement at
         * least the following parts of the *WebKit2.WebView* interface:
         *
         * > Signals: {
         * >     'load-changed': {
         * >         param_types: [ GObject.TYPE_INT ] // WebKitLoadEvent
         * >     },
         * >     'decide-policy': {
         * >         param_types: [
         * >             GObject.TYPE_OBJECT, // WebKitPolicyDecision
         * >             GObject.TYPE_INT // WebKitPolicyDecisionType
         * >         ],
         * >         return_type: GObject.TYPE_BOOLEAN,
         * >         flags: GObject.SignalFlags.RUN_LAST
         * >     }
         * > },
         * > load_uri: function (uri) {
         * >     ...
         * > }
         *
         * In addition, the object marked WebKitPolicyDecision must have
         * *use()*, *ignore()*, and *download()* methods, all taking no
         * parameters.
         * It does not need to exist if the *decide-policy* signal is never
         * emitted.
         *
         * If a signal handler returns *null*, then the next handler will be
         * invoked for this signal.
         *
         * If all handlers return *null* (or there are no registered handlers),
         * then a best effort is made to display the relevant content.
         *
         * Parameters:
         *   file - File to display in view (*Gio.File*)
         *
         * Return type:
         *   Gtk.Widget
         *
         * Flags:
         *   run last
         *
         * Since:
         *   Version 0.2
         */
        'create-view-for-file' : {
            param_types: [ Gio.File.$gtype ],
            return_type: Gtk.Widget.$gtype,
            // FIXME: possibly the above should be an adapter interface, rather
            // than a Gtk.Widget that is expected to have certain signals and
            // methods.
            flags: GObject.SignalFlags.RUN_LAST,
            accumulator: GObject.AccumulatorType.FIRST_WINS
        },
        /**
         * Event: decide-navigation-policy
         * Proxy for the *decide-policy* signal of *WebKit2.WebView*
         *
         * This signal is emitted when the webview requests making a navigation
         * decision.
         * Use it to decide when to switch this view to a new page and when to
         * let the webview load a new page normally.
         *
         * For example, if you want to load a new page in the switcher:
         * > switcher.connect('decide-navigation-policy', function (switcher, decision) {
         * >     switcher.load_uri(decision.request.uri, EosKnowledge.LoadingAnimationType.NONE);
         * >     decision.ignore();
         * >     return true; // decision was made
         * > });
         * but if you want to let the page load as normal without switching to
         * a new page, simply return *false* to let the default rules apply.
         *
         * The webview's *decide-policy* signal also asks about different kinds
         * of policy decisions, such as whether to download a file or load a
         * resource request, but those are not proxied here.
         * If you want to track those, connect directly to the webview's
         * original signal.
         *
         * Parameters:
         *   decision - a *GObject.Object*; if you are using a web view, then
         *      this will be a *WebKit2.NavigationPolicyDecision*
         *
         * Return type:
         *   boolean
         *
         * Flags:
         *   run last
         */
        'decide-navigation-policy': {
            param_types: [ GObject.TYPE_OBJECT ],
            return_type: GObject.TYPE_BOOLEAN,
            flags: GObject.SignalFlags.RUN_LAST,
            // FIXME (disappointed voice) Oh, GJS...
            // https://bugzilla.gnome.org/show_bug.cgi?id=729363
            // accumulator: GObject.AccumulatorType.TRUE_HANDLED
        },

        /**
         * Event: display-ready
         * When the page is loaded and fully displayed
         *
         * This signal is emitted when a new page has been loaded and all
         * animations for displaying it are complete.
         */
        'display-ready': {}
    },

    MIN_WIDTH: 400,
    MIN_HEIGHT: 300,

    _init: function (props) {
        this._active_view = null;
        this._offscreen_window = new Gtk.OffscreenWindow();
        props = props || {};
        // WebKit WebViews have no minimum size, so we'll ask for one to keep the
        // webview from getting unusable small
        props.width_request = this.MIN_WIDTH;
        props.height_request = this.MIN_HEIGHT;
        this.parent(props);
    },

    // Default handler for create-webview signal
    // FIXME: This is subject to a bug where return values from default handlers
    // are ignored.
    // https://bugzilla.gnome.org/show_bug.cgi?id=729288
    // When the bug is fixed, move the body of _on_create_webview() to
    // on_create_webview(), and remove the workarounds below and in
    // testWebviewSwitcher.js.
    on_create_webview: function () {},
    _on_create_webview: function () {
        return new WebKit2.WebView();
    },

    _choose_view: function (uri) {
        let file = Gio.File.new_for_uri(uri);

        let view_from_handler = this.emit('create-view-for-file', file);
        if (view_from_handler !== null)
            return view_from_handler;

        // FIXME: Remove once we bump the major version and remove the
        // deprecated signal create-webview. Replace with
        // return new EvinceWebviewAdapter.EvinceWebviewAdapter().
        let webview = this.emit('create-webview');

        // FIXME: Calling _on_create_webview() should not be necessary when
        // https://bugzilla.gnome.org/show_bug.cgi?id=729288 is fixed.
        return webview !== null ? webview : this._on_create_webview();
    },

    _get_new_view: function (uri) {
        let view = this._choose_view(uri);
        view.connect('decide-policy', function (v, decision, type) {
            if (type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return this.emit('decide-navigation-policy', decision);
            return false;
        }.bind(this));
        return view;
    },

    _animation_to_transition_type: function (animation_type) {
        switch (animation_type) {
            case EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION:
                return Gtk.StackTransitionType.UNDER_RIGHT;
            case EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION:
                return Gtk.StackTransitionType.OVER_LEFT;
            default:
                return Gtk.StackTransitionType.NONE;
        }
    },

    // Make the preparing view the new active view.
    _update_active_view: function (new_view) {
        if (this._active_view !== null &&
            this === this._active_view.get_parent())
            this.remove(this._active_view);
        this._active_view = new_view;
        this._active_view.grab_focus();
        this.emit('display-ready');
    },

    /**
     * Method: load_uri
     * Load a new page
     *
     * This function emits the <create-webview> signal in order to get a
     * webview, and subsequently loads *uri* in that webview.
     * When *uri* is finished loading, it makes the webview the visible child
     * of this view (using whatever stack transition type has been previously
     * set on the view).
     * When the transition is complete, it removes the old view.
     *
     * Parameters:
     *    uri - the URI to load (string)
     *    animation_type - how the webview should animate when loading
     *    the page
     */
    load_uri: function (uri, animation_type) {
        if (this._active_view === null) {
            let view = this._get_new_view(uri);
            this.add(view);
            view.load_uri(uri);
            view.show_all();
            this._update_active_view(view);
        } else {
            this.transition_type = this._animation_to_transition_type(animation_type);
            let view = this._get_new_view(uri);
            let load_id = view.connect('load-changed', function (v, status) {
                if (status !== WebKit2.LoadEvent.COMMITTED)
                    return;

                view.disconnect(load_id);
                view.reparent(this);

                if (this.transition_type === Gtk.StackTransitionType.NONE) {
                    this.visible_child = view;
                    this._update_active_view(view);
                    return;
                }

                // Show the prepared view and clean up the old view when it is
                // finished showing
                let id = this.connect('notify::transition-running',
                    function () {
                        if (this.transition_running)
                            return;

                        this.disconnect(id);
                        this._update_active_view(view);
                    }.bind(this));

                this.visible_child = view;
            }.bind(this));
            // Web views try to be clever and so won't load a page if they're not
            // visible. We are even cleverer, and stick them in an offscreen
            // window so they think they are visible.
            // If there is already a webview loading in the offscreen window,
            // we should destroy it and replace it with the new one
            if (this._offscreen_window.get_child() !== null)
                this._offscreen_window.get_child().destroy();

            this._offscreen_window.add(view);
            this._offscreen_window.show_all();

            view.load_uri(uri);
        }
    }
});
