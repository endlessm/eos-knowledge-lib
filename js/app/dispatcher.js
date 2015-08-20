// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Dispatcher = new Lang.Class({
    Name: 'Dispatcher',
    GTypeName: 'EknDispatcher',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        this._queue = [];
        this._listeners = {};
        this._listener_counter = 0;
    },

    start: function () {
        // Use low priority to make sure we only emit a new action once all GUI
        // events from GTK have been processed.
        this._idle_id = GLib.idle_add(GLib.PRIORITY_LOW,
            this._process_queue.bind(this));
    },

    quit: function () {
        GLib.source_remove(this._idle_id);
    },

    _process_queue: function () {
        let payload = this._queue.shift();
        if (!payload)
            return GLib.SOURCE_CONTINUE;

        for (let id in this._listeners) {
            try {
                this._listeners[id](payload);
            } catch (error) {
                logError(error);
            }
        }
        return GLib.SOURCE_CONTINUE;
    },

    dispatch: function (payload) {
        if (!payload.action_type)
            throw new Error('Dispatch payloads need an action_type');
        this._queue.push(payload);
    },

    register: function (callback) {
        this._listeners[this._listener_counter] = callback;
        return this._listener_counter++;
    },

    unregister: function (id) {
        delete this._listeners[id];
    },
});

let get_default = (function () {
    let default_dispatcher;
    return function () {
        if (!default_dispatcher)
            default_dispatcher = new Dispatcher();
        return default_dispatcher;
    };
})();
