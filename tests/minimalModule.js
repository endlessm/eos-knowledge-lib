const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

const MinimalModule = new Lang.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});
