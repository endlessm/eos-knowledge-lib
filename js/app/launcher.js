const GObject = imports.gi.GObject;
const Lang = imports.lang;

/**
 * Class: Launcher
 * Interface for presenters and other app launchers
 *
 * Knowledge apps can be launched in three ways: directly from the desktop, as
 * the result of clicking on a desktop search result, and with a search query.
 * Whatever launches your app should implement <Launcher> in order to
 * distinguish between these three.
 *
 * This is conceptually an interface, but is a base class for technical reasons.
 *
 * Since:
 *   0.2
 */
const Launcher = new Lang.Class({
    Name: 'Launcher',
    GTypeName: 'EknLauncher',
    Extends: GObject.Object,

    /**
     * Method: desktop_launch
     * Tell the launcher to launch "normally"
     *
     * The launch is the result of opening an app from the desktop or starting
     * it from the command line.
     * This method _must_ be implemented in a subclass.
     *
     * You can pass @timestamp to Gtk.Window.present_with_time() in your
     * implementation of this method, to show your main window.
     *
     * Parameters:
     *   timestamp - the time the interaction was requested at
     */
    desktop_launch: function (timestamp) {
        throw new Error('desktop_launch() must be implemented in a subclass ' +
            'of Launcher.');
    },

    /**
     * Method: search
     * Tell the launcher to process a search
     *
     * The expected behavior is for the app to display the search results as if
     * the search had been executed manually within the app.
     * However, if you do not override <Launcher.search>, then this will do the
     * same thing as <Launcher.desktop_launch> by default.
     *
     * You can pass timestamp to Gtk.Window.present_with_time() in your
     * implementation of this method, to show your main window.
     *
     * Parameters:
     *   timestamp - the time the interaction was requested at
     *   query - the search query to process
     */
    search: function (timestamp, query) {
        this.desktop_launch(timestamp);
    },

    /**
     * Method: activate_search_result
     * Tell the launcher to open a search result from a desktop search
     *
     * The expected behavior is for the app to display the document directly.
     * However, if you do not override <Launcher.activate_search_result>, then
     * this will do the same thing as <Launcher.desktop_launch> by default.
     *
     * You can pass timestamp to Gtk.Window.present_with_time() in your
     * implementation of this method, to show your main window.
     *
     * Parameters:
     *   timestamp - the time the interaction was requested at
     *   id - the knowledge engine ID of the document to open
     *   query - the search query that led to this result
     */
    activate_search_result: function (timestamp, id, query) {
        this.desktop_launch(timestamp);
    }
});
