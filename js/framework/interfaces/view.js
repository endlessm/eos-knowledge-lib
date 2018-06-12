const {DModel, GLib, GObject, Gtk} = imports.gi;
const Lang = imports.lang;

const {Module} = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

/**
 * Interface: View
 * Interface for modules that show a database record
 *
 * Requires:
 *   Gtk.Widget
 */
var View = new Lang.Interface({
    Name: 'View',
    GTypeName: 'EknView',
    Requires: [Gtk.Widget, Module],

    Properties: {
        /**
         * Property: model
         * Record backing this view
         *
         * Every view is backed by a record in the database.
         * A view's record is represented by a `DModel.Content` or one of
         * its subclasses.
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Model with which to create this view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            DModel.Content),
    },

    /**
     * Method: set_label_or_hide
     *
     * Sets a label contents and hides if contents is empty.
     */
    set_label_or_hide: function (label, text) {
        label.label = GLib.markup_escape_text(text, -1);
        label.visible = !!text;
    },

    /**
     * Method: set_title_label_from_model
     *
     * Sets up a label to show the model's title.
     */
    set_title_label_from_model: function (label) {
        this.set_label_or_hide(label, this.model.title);
        let context = label.get_style_context();
        context.add_class(Utils.get_element_style_class('View', 'title'));
        context.add_class(Utils.get_element_style_class(this.constructor, 'title'));
    },
});
