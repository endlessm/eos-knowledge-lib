/* exported Class */

// Copyright (C) 2016 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: Class
 * Syntactic sugar for classes
 *
 * This is a metaclass that goes a few steps farther than Lang.Class in
 * implementing some syntactic sugar.
 * Use it as you would use Lang.Class:
 *
 * > const MyClass = new Knowledge.Class({
 * >     Name: 'MyClass',
 * >     Extends: Gtk.Button,
 * >
 * >     Properties: { ... },
 * >     StyleProperties: { ... },
 * > });
 *
 * If no GTypeName is given, then it will automatically be set to the class's
 * Name, prefixed with 'Ekn', as opposed to the 'Gjs_' that Lang.Class uses.
 *
 * Properties from interfaces listed in Implements: are overridden
 * automatically, meaning there's no need for you to use
 * GObject.ParamSpec.override.
 *
 * You can also supply a StyleProperties key when defining a class.
 * This only works for classes that inherit from Gtk.Widget.
 * This will install style properties on the widget's class so that you can
 * set them from CSS like so:
 *
 * > EknMyClass {
 * >     -EknMyClass-foo-bar: 5;
 * > }
 */
const Class = new Lang.Class({
    Name: 'Class',
    Extends: GObject.Class,

    _construct: function (props={}) {
        if (!props.GTypeName)
            props.GTypeName = 'Ekn' + props.Name;

        props.Properties = props.Properties || {};
        props.Implements = props.Implements || [];

        // Override GObject properties before chaining
        props.Implements.filter(iface => '$gtype' in iface)
        .forEach(iface => {
            let iface_props =
                EosKnowledgePrivate.interface_gtype_list_properties(iface.$gtype);
            iface_props.forEach(prop => {
                props.Properties[prop.name] =
                    GObject.ParamSpec.override(prop.name, iface);
            });
        });

        // Remove StyleProperties before chaining
        let style_properties = props.StyleProperties || {};
        delete props.StyleProperties;

        let metaclass = Lang.getMetaClass(props) || Lang.Class;
        let newclass = metaclass.prototype._construct(props);

        if (metaclass === Gtk.Widget.prototype.__metaclass__) {
            Object.keys(style_properties).forEach(prop =>
                Gtk.Widget.install_style_property.call(newclass,
                    style_properties[prop]));
        } else if (Object.keys(style_properties).length) {
            // Unfortunately, the above call will cheerfully succeed even if
            // newclass isn't a Gtk.Widget
            throw new Error("You're trying to install style properties on " +
                "something that isn't a GtkWidget, but a " + newclass.$gtype.name);
        }

        return newclass;
    },
});
