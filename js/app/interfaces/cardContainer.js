/* exported CardContainer */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Interface: CardContainer
 * Interface for modules that show and arrange cards
 */
const CardContainer = new Lang.Interface({
    Name: 'CardContainer',
    GTypeName: 'EknCardContainer',
    Requires: [ Gtk.Widget ],

    Properties: {
        /**
         * Property: fade-cards
         * Whether to fade in new cards or just show them
         *
         * Set this to *true* to make newly added cards fade in, instead of
         * appearing abruptly.
         * This will only happen for the subsequent batches of cards added
         * beyond the first.
         * The animation's appearance is controlled by the *invisible* and
         * *fade-in* CSS classes on the card widget.
         *
         * Default value:
         *   *false*
         */
        'fade-cards': GObject.ParamSpec.boolean('fade-cards', 'Fade cards',
            'Whether to fade in new cards or just show them',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },
});
