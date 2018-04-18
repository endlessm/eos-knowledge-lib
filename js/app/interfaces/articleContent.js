const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const {View} = imports.app.interfaces.view;

/**
 * Interface: ArticleContent
 * Interface for article content modules
 *
 * Requires:
 *   <View>
 */
var ArticleContent = new Lang.Interface({
    Name: 'ArticleContent',
    GTypeName: 'EknArticleContent',
    Requires: [View],

    Properties: {
        /**
         * Property: content-view
         *
         * The widget created by this widget to display article content.
         * Read-only
         */
        'content-view': GObject.ParamSpec.object('content-view', 'Content view',
            'The view used to show article content.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
        /**
         * Property: custom-css
         * Name of a custom CSS file to apply to web content
         */
        'custom-css': GObject.ParamSpec.string('custom-css', 'Custom CSS',
            'Name of a custom CSS file to apply to web content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: nav-content
         */
        'nav-content': GObject.ParamSpec.object('nav-content',
            'Navigation Content', 'Navigation Content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
    },

    Signals: {
        /**
         * Event: ekn-link-clicked
         * Emitted when an link with an internal ID is clicked in the article
         * page.
         * Passes the ID.
         */
        'ekn-link-clicked': {
            param_types: [
                GObject.TYPE_STRING /* ID */,
            ]
        },
    },

    /**
     * Method: load_content_promise
     * Returns a promise for asynchronously loading the document content.
     */
    load_content_promise: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: set_active (is_active)
     * Activate or deactivate the content being displayed on this page.
     * An example use case would be the video player starting or stopping
     * its playback.
     *
     */
    set_active: Lang.Interface.UNIMPLEMENTED,
});
