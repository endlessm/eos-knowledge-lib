// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Knowledge = imports.app.knowledge;

var Dispatcher = new Knowledge.Class({
    Name: 'Dispatcher',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        this._queue = [];
        this._listeners = {};
        this._listener_counter = 0;
        this._idle_id = 0;
        this._paused = false;
    },

    pause: function () {
        this._clear_idle();
        this._paused = true;
    },

    resume: function () {
        this._paused = false;
        if (this._queue.length > 0)
            this._add_idle();
    },

    _add_idle: function () {
        if (this._paused)
            return;
        if (this._idle_id === 0)
            this._idle_id = GLib.idle_add(Gtk.PRIORITY_RESIZE - 10,
                this._process_queue.bind(this));
    },

    _clear_idle: function () {
        if (this._idle_id)
            GLib.source_remove(this._idle_id);
        this._idle_id = 0;
    },

    _process_queue: function () {
        let payload = this._queue.shift();
        if (payload) {
            for (let id in this._listeners) {
                try {
                    this._listeners[id](payload);
                } catch (error) {
                    logError(error);
                }
            }
            if (this._queue.length > 0)
                return GLib.SOURCE_CONTINUE;
        }

        this._idle_id = 0;
        return GLib.SOURCE_REMOVE;
    },

    dispatch: function (payload) {
        if (!payload.action_type)
            throw new Error('Dispatch payloads need an action_type');
        this._queue.push(payload);
        this._add_idle();
    },

    register: function (callback) {
        this._listeners[this._listener_counter] = callback;
        return this._listener_counter++;
    },

    unregister: function (id) {
        delete this._listeners[id];
    },

    reset: function () {
        this._clear_idle();
        this._queue = [];
        this._listeners = {};
        this._listener_counter = 0;
    },
});

var get_default = (function () {
    let default_dispatcher;
    return function () {
        if (!default_dispatcher)
            default_dispatcher = new Dispatcher();
        return default_dispatcher;
    };
})();
