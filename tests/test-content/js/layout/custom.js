// Copyright 2018 Endless Mobile, Inc.

/* exported Custom */

const Module = imports.app.interfaces.module;
const OCustom = custom_modules.custom.custom;

var Custom = new Module.Class({
    Name: 'Layout.Custom',
    Extends: OCustom.Custom,

    _init(props={}) {
        props.label = 'Overridden';
        this.parent(props);
    },
});
