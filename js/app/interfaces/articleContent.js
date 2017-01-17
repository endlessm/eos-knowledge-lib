const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;

/**
 * Interface: ArticleContent
 * Interface for article content modules
 *
 * Requires:
 *   <Card>
 */
const ArticleContent = new Lang.Interface({
    Name: 'ArticleContent',
    GTypeName: 'EknArticleContent',
    Requires: [ Card.Card ],

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
    },

    Signals: {
        /**
         * Event: ekn-link-clicked
         * Emitted when a ekn id link in the article page is clicked.
         * Passes the ID.
         */
        'ekn-link-clicked': {
            param_types: [
                GObject.TYPE_STRING /* ekn-uri */,
            ]
        },
    },

    /**
     * Method: load_content
     * Load the content for this article
     *
     */
    load_content: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: load_content_finish
     * Call this to end the async task
     *
     */
    load_content_finish: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: clear_content
     * Clear the content for this article, and free
     * any resources associated with the content view.
     *
     */
    clear_content: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: set_active (is_active)
     * Activate or deactivate the content being displayed on this page.
     * An example use case would be the video player starting or stopping
     * its playback.
     *
     */
    set_active: Lang.Interface.UNIMPLEMENTED,
});
