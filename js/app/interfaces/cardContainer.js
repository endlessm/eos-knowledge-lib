/* exported CardContainer */

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
});
