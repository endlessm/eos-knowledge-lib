// Copyright 2017 Endless Mobile, Inc.

/* exported Articles */

const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;
const Tagged = imports.framework.modules.filter.tagged;

var Articles = new Module.Class({
    Name: 'Filter.Articles',
    Extends: Tagged.Tagged,
    Implements: [Filter.Filter],

    _init: function (props={}) {
        props.tag = 'EknArticleObject';
        this.parent(props);
    },
});
