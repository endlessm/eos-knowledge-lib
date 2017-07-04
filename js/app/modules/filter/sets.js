// Copyright 2016 Endless Mobile, Inc.

/* exported Sets */

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const Tagged = imports.app.modules.filter.tagged;

var Sets = new Module.Class({
    Name: 'Filter.Sets',
    Extends: Tagged.Tagged,
    Implements: [Filter.Filter],

    _init: function (props={}) {
        props.tag = 'EknSetObject';
        this.parent(props);
    },
});
