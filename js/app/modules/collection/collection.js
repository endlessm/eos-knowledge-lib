/* exported Collection */

// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;

const Collection = new Module.Class({
    Name: 'Collection',
    Extends: GObject.Object,
    Abstract: true,

    Properties: {
        'loading': GObject.ParamSpec.boolean('loading', 'Loading',
            'Whether the collection is busy loading',
            GObject.ParamFlags.READABLE, false),
        'can-load-more': GObject.ParamSpec.boolean('can-load-more',
            'Can load more', 'Whether the collection has more items to load',
            GObject.ParamFlags.READABLE, true),
        /**
         * Property: title
         * Title of this collection
         */
        'title': GObject.ParamSpec.string('title',
            'Title', 'Title of this content group',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    Signals: {
        'models-changed': {},
    },

    Slots: {
        'order': {},
        'filter': {},
    },

    _init: function (props={}) {
        this.parent(props);
        this._models_by_id = new Map();
        this._order = this.create_submodule('order');
        this._filter = this.create_submodule('filter');
    },

    load_more: function (num_desired) {
        void num_desired;
        throw new Error('You should be implementing this in your subclass');
    },

    get_models: function () {
        let models = [...this._models_by_id.values()];
        if (this._order)
            models.sort(this._order.compare.bind(this._order));
        return models;
    },

    /* Private, intended to be used from subclasses */
    add_model: function (model) {
        if (this._models_by_id.has(model.ekn_id))
            return false;

        if (this._filter && !this._filter.include(model))
            return false;

        this._models_by_id.set(model.ekn_id, model);
        return true;
    },
});
