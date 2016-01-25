// Copyright 2015 Endless Mobile, Inc.

/* exported ScrollingTemplate */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

/**
 * Class: ScrollingTemplate
 * Layout template that allows its content to scroll vertically
 *
 * Slots:
 *   content - where to put the content
 */
const ScrollingTemplate = new Lang.Class({
    Name: 'ScrollingTemplate',
    GTypeName: 'EknScrollingTemplate',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/scrollingTemplate.ui',
    InternalChildren: [ 'viewport' ],

    _init: function (props={}) {
        this.parent(props);

        let content = this.create_submodule('content');

        this._viewport.add(content);

        this.connect('need-more-content', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.NEED_MORE_CONTENT,
                scroll_server: this.name,
            });
        });

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.CONTENT_ADDED:
                    if (payload.scroll_server === this.name) {
                        this.new_content_added();
                    }
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['content'];
    },
});
