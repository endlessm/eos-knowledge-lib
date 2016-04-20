/* exported Class */

// Copyright 2016 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
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
 * > // ...
 * > });
 *
 * If no GTypeName is given, then it will automatically be set to the class's
 * Name, prefixed with 'Ekn', as opposed to the 'Gjs_' that Lang.Class uses.
 *
 * Properties from interfaces listed in Implements: are overridden
 * automatically, meaning there's no need for you to use
 * GObject.ParamSpec.override.
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

        let metaclass = Lang.getMetaClass(props) || Lang.Class;
        return metaclass.prototype._construct(props);
    },
});
