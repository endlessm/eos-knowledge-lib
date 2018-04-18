/* exported Selection */

// Copyright 2016 Endless Mobile, Inc.

const {DModel, GObject} = imports.gi;
const Lang = imports.lang;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

/**
 * Class: Selection
 */
var Selection = new Module.Class({
    Name: 'Selection',
    Extends: GObject.Object,
    Abstract: true,

    Properties: {
        'loading': GObject.ParamSpec.boolean('loading', 'Loading',
            'Whether the selection is busy loading',
            GObject.ParamFlags.READABLE, false),
        'needs-refresh': GObject.ParamSpec.boolean('needs-refresh', 'Needs refresh',
            'Whether the content of the selection needs to refresh its models based on the current state of the HistoryStore',
            GObject.ParamFlags.READABLE, false),
        'can-load-more': GObject.ParamSpec.boolean('can-load-more',
            'Can load more', 'Whether the selection has more items to load',
            GObject.ParamFlags.READABLE, true),
        'global': GObject.ParamSpec.boolean('global',
            'Global', 'Whether the selection gets its model from global state or not',
            GObject.ParamFlags.READABLE, true),
        'in-error-state': GObject.ParamSpec.boolean('in-error-state',
            'In error state',
            'Whether the selection encountered an error while loading',
            GObject.ParamFlags.READABLE, false),
        /**
         * Property: model
         *
         * Type:
         *   `DModel.Content`
         *
         * Content object model to back this selection. For some selections, it is provided
         * on construction. If not, then it will get its model from global state.
         *
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Content model to back this selection',
            GObject.ParamFlags.READWRITE, DModel.Content),
    },

    Signals: {
        'models-changed': {},
    },

    Slots: {
        'order': {},
        'filter': {},
    },

    _init: function (props={}) {
        this._model = null;
        this.parent(props);
        // If no model is provided upon construction, we must be getting our model from global state.
        this.global = !this.model;
        this._models_by_id = new Map();
        this._order = this.create_submodule('order');
        this._filter = this.create_submodule('filter');
        this._needs_refresh = false;
        if (this._filter) {
            this._filter.connect('filter-changed', () => {
                this._set_needs_refresh(true);
            });
        }
    },

    get model () {
        return this._model;
    },

    set model (v) {
        this._model = v;
        this.notify('model');
    },

    contains_model: function (model) {
        if (!model)
            return false;
        return this._models_by_id.has(model.id);
    },

    provides_context: function () {
        return true;
    },

    get needs_refresh () {
        return this._needs_refresh;
    },

    _set_needs_refresh: function (v) {
        if (v === this._needs_refresh)
            return;
        this._needs_refresh = v;
        this.notify('needs-refresh');
    },

    queue_load_more: function (num_desired) {
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
        if (this._models_by_id.has(model.id))
            return false;

        if (this._filter && !this._filter.include(model))
            return false;

        this._models_by_id.set(model.id, model);
        return true;
    },

    clear: function () {
        this._models_by_id.clear();
        this.emit('models-changed');
    },

    // This is called when a user hits the 'see more' trigger on a content group
    // backed by this selection.
    show_more: function () {
        // NO-OP - implement in subclass
    },

    emit_models_when_not_animating: function () {
        let store = HistoryStore.get_default();
        if (!store.animating) {
            this.emit('models-changed');
        } else {
            let id = store.connect('notify::animating', () => {
                if (!store.animating) {
                    this.emit('models-changed');
                }
                store.disconnect(id);
            });
        }
    },

    /**
     * Method: get_error
     * Retrieve exception object from last encountered error
     *
     * This will return null if the selection is not in an error state.
     */
    get_error: Lang.UNIMPLEMENTED,
});
