// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;

const Dispatcher = imports.framework.dispatcher;
const Knowledge = imports.framework.knowledge;

// Similar to our actual dispatcher, but entirely synchronous and does not catch
// errors, which will make our tests easier to write and fail faster.
var MockDispatcher = new Knowledge.Class({
    Name: 'MockDispatcher',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        this._queue = [];
        this._listeners = {};
        this._listener_counter = 0;
        this._processing = false;
        // For testing
        this.dispatched_payloads = [];
    },

    _process_queue: function () {
        this._processing = true;
        let payload = this._queue.shift();
        if (payload) {
            for (let id in this._listeners)
                this._listeners[id](payload);
            this.dispatched_payloads.push(payload);
            this._process_queue();
        }
        this._processing = false;
    },

    pause: function () {},

    resume: function () {},

    dispatch: function (payload) {
        this._queue.push(payload);
        if (!this._processing)
            this._process_queue();
    },

    register: function (callback) {
        this._listeners[this._listener_counter] = callback;
        return this._listener_counter++;
    },

    unregister: function (id) {
        delete this._listeners[id];
    },

    payloads_with_type: function (action_type) {
        let payloads = [];
        for (let payload of this.dispatched_payloads) {
            if (payload.action_type === action_type)
                payloads.push(payload);
        }
        return payloads;
    },

    last_payload_with_type: function (action_type) {
        return this.payloads_with_type(action_type).pop();
    },

    has_payload_sequence: function (action_types) {
        return this.dispatched_payloads.some((payload, payload_index) =>
            action_types.every((action, action_index) =>
                this.dispatched_payloads[payload_index + action_index].action_type === action));
    },

    reset: function () {
        this.dispatched_payloads = [];
    },
});

// Creates a new MockDispatcher and sets it up as the dispatcher singleton. Use
// in a beforeEach to have a new dispatcher each test iteration.
function mock_default() {
    let dispatcher = new MockDispatcher();
    spyOn(Dispatcher, 'get_default').and.callFake(() => dispatcher);
    return dispatcher;
};
