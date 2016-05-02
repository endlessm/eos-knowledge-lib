// Copyright 2015 Endless Mobile, Inc.

/* exported Scrollable */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Interface: Scrollable
 *
 * An scrollable interface is implemented by a widget
 * which may have extra content that it does not immediately
 * show on the screen.
 */
const Scrollable = new Lang.Interface({
    Name: 'Scrollable',
    GTypeName: 'EknScrollable',
    Requires: [ Module.Module ],

    Properties: {
        /**
         * Property: scroll-server
         * The scroll server backing this module.
         *
         * A string specifying the 'name' of the InfiniteScrollingLayout module which
         * will provide updates to this module regarding when to load more
         * content.
         */
        'scroll-server': GObject.ParamSpec.string('scroll-server', 'Scroll server',
            'Scroll server that tells this module when to load more content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    /**
     * Method: scrollable_init
     * Set up the dispatcher signals for this interface. All modules which
     * implement the scrollable interface will receive the NEED_MORE_CONTENT
     * signal. Each module will then check if the signal was meant for it by
     * comparing the scroll_server property on the payload (which uniquely
     * identifies a InfiniteScrollingLayout) to the scroll_server property they have.
     */
    scrollable_init: function () {
        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.NEED_MORE_CONTENT:
                    if (payload.scroll_server === this.scroll_server) {
                        this.show_more_content();
                    }
                    break;
            }
        });
    },

    /**
     * Method: show_more_content
     * Load more content for this module
     */
    show_more_content: Lang.Interface.UNIMPLEMENTED,
});
