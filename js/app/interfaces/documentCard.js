const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;

/**
 * Interface: DocumentCard
 * Interface for document card modules
 *
 * Requires:
 *   <Card>
 */
const DocumentCard = new Lang.Interface({
    Name: 'DocumentCard',
    GTypeName: 'EknDocumentCard',
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
     * Load the content for this document
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
     * Clear the content for this document, and free
     * any resources associated with the content view.
     *
     */
    clear_content: Lang.Interface.UNIMPLEMENTED,
});
