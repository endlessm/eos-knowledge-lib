// Copyright 2017 Endless Mobile, Inc.

/* exported Articles */

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const Tagged = imports.app.modules.filter.tagged;

var Articles = new Module.Class({
    Name: 'Filter.Articles',
    Extends: Tagged.Tagged,
    Implements: [Filter.Filter],

    _init: function (props={}) {
        props.tag = 'EknArticleObject';
        this.parent(props);
    },
});
