// Copyright 2016 Endless Mobile, Inc.

/* exported Sets */

const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;
const Tagged = imports.framework.modules.filter.tagged;

var Sets = new Module.Class({
    Name: 'Filter.Sets',
    Extends: Tagged.Tagged,
    Implements: [Filter.Filter],

    _init: function (props={}) {
        props.tag = 'EknSetObject';
        this.parent(props);
    },
});
