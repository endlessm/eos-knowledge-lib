/* exported Class */

// Copyright 2016 Endless Mobile, Inc.

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
 */
const Class = new Lang.Class({
    Name: 'Class',
    Extends: GObject.Class,

    _construct: function (props={}) {
        let metaclass = Lang.getMetaClass(props) || Lang.Class;
        return metaclass.prototype._construct(props);
    },
});
