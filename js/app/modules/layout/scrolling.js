// Copyright 2016 Endless Mobile, Inc.

/* exported Scrolling */

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: Scrolling
 * Layout template that allows its content to scroll vertically
 *
 * Slots:
 *   content - where to put the content
 */
const Scrolling = new Module.Class({
    Name: 'Layout.Scrolling',
    Extends: Gtk.ScrolledWindow,

    Slots: {
        'content': {},
    },

    _init: function (props={}) {
        this.parent(props);
        this.add(this.create_submodule('content'));

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.SHOW_HOME_PAGE:
                case Actions.SHOW_ALL_SETS_PAGE:
                case Actions.SHOW_SECTION_PAGE:
                case Actions.SHOW_SEARCH_PAGE:
                case Actions.SHOW_ARTICLE_PAGE:
                    this._return_to_top();
                    break;
            }
        });
    },

    // return scroll position to the top of the window
    _return_to_top: function () {
        let lower = this.vadjustment.get_lower();
        if (this.vadjustment.get_value() !== lower) {
            this.vadjustment.set_value(lower);
        }
    },
});
