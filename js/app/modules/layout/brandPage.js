/* exported BrandPage */

// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: BrandPage
 * Display a brand screen for 2 seconds
 */
const BrandPage = new Module.Class({
    Name: 'Layout.BrandPage',
    Extends: Gtk.Stack,

    Slots: {
        'brand': {},
        'content': {},
    },

    // Overridable in tests. Brand page should be visible for 2 seconds. The
    // transition is currently hardcoded to a slow fade over 500 ms.
    TRANSITION_TIME_MS: 1500,

    _init: function (props={}) {
        props.transition_duration = 500;
        props.transition_type = Gtk.StackTransitionType.CROSSFADE;
        this.parent(props);

        this._brand_shown = false;
        this._brand_timeout_id = 0;
        this._content_ready = false;

        this._brand = this.create_submodule('brand');
        this._content = this.create_submodule('content');

        this.add(this._brand);
        this.add(this._content);

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.DBUS_LOAD_QUERY_CALLED:
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    if (this._brand_timeout_id !== 0) {
                        GLib.source_remove(this._brand_timeout_id);
                        this._brand_timeout_id = 0;
                    }
                    this.visible_child = this._content;
                    this._content_ready = true;
                    this._brand_shown = true;
                    break;
            }
        });
    },

    _reveal_content_if_ready: function () {
        if (!this._content_ready || this._brand_timeout_id !== 0)
            return;
        this.visible_child = this._content;
        this._brand_shown = true;
    },

    _start_brand_timer: function () {
        this._brand_timeout_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.TRANSITION_TIME_MS, () => {
            this._brand_timeout_id = 0;
            this._reveal_content_if_ready();
            return GLib.SOURCE_REMOVE;
        });
        this._content.make_ready(() => {
            this._content_ready = true;
            this._reveal_content_if_ready();
        });
    },

    // Module override
    make_ready: function (cb=function () {}) {
        if (this._brand_shown) {
            this._content.make_ready(cb);
            return;
        }
        this._brand.make_ready(() => {
            this.visible_child = this._brand;
            cb();
            this._start_brand_timer();
        });
    },
});
