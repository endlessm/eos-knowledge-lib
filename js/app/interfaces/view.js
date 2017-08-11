const Eknc = imports.gi.EosKnowledgeContent;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const {Module} = imports.app.interfaces.module;
const Utils = imports.app.utils;

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
         * A view's record is represented by a <ContentObjectModel> or one of
         * its subclasses.
         *
         * Type:
         *   <ContentObjectModel>
         *
         * Flags:
         *   Construct only
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Model with which to create this view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Eknc.ContentObjectModel),
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
