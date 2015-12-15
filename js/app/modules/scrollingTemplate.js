// Copyright 2015 Endless Mobile, Inc.

/* exported ScrollingTemplate */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const Scrollable = imports.app.interfaces.scrollable;

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
        this._connect_client(this);
    },

    _connect_client: function (module) {
        let children = module.get_children();
        children.forEach((child) => {
            if (child.constructor.implements && child.constructor.implements(Scrollable.Scrollable)) {
                this.connect('need-more-content', () => {
                    child.show_more_content();
                });
            }
            if (typeof child.get_children === 'function') {
                this._connect_client(child);
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['content'];
    },
});
