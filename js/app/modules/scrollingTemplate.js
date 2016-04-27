// Copyright (C) 2015-2016 Endless Mobile, Inc.

/* exported ScrollingTemplate */

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
const ScrollingTemplate = new Module.Class({
    Name: 'ScrollingTemplate',
    CssName: 'EknScrollingTemplate',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,

    Slots: {
        'content': {},
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
                case Actions.SHOW_HOME_PAGE:
                case Actions.SHOW_ALL_SETS_PAGE:
                case Actions.SHOW_SECTION_PAGE:
                case Actions.SHOW_SEARCH_PAGE:
                case Actions.SHOW_ARTICLE_PAGE:
                    this._return_to_top();
                    break;
                case Actions.CONTENT_ADDED:
                    if (payload.scroll_server === this.name) {
                        this.new_content_added();
                    }
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
