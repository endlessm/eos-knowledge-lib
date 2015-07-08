// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: ArticlePage
 *
 * The article page of template A of the knowledge apps.
 */
const ArticlePage = new Lang.Class({
    Name: 'ArticlePage',
    GTypeName: 'EknArticlePage',
    Extends: Gtk.Stack,

    CONTENT_TRANSITION_DURATION: 500,

    _init: function (props={}) {
        props.expand = true;
        props.transition_duration = this.CONTENT_TRANSITION_DURATION;
        this.parent(props);

        // Clear old views from the stack when its not animating.
        this.connect('notify::transition-running', function () {
            if (!this.transition_running) {
                for (let child of this.get_children()) {
                    if (child !== this.visible_child)
                        this.remove(child);
                }
            }
        }.bind(this));
        this.show_all();
    },

    /**
     * Method: switch_in_document_card
     *
     * Takes a card widget and a <EosKnowledgePrivate.LoadingAnimation>. Will
     * animate in the new document card according to the type of loading
     * animation specified.
     */
    switch_in_document_card: function (view, animation_type) {
        if (animation_type === EosKnowledgePrivate.LoadingAnimation.FORWARDS_NAVIGATION) {
            this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
        } else if (animation_type === EosKnowledgePrivate.LoadingAnimation.BACKWARDS_NAVIGATION) {
            this.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
        } else {
            this.transition_type = Gtk.StackTransitionType.NONE;
        }

        view.show_all();
        if (view.get_parent() !== null) {
            view.reparent(this);
        } else {
            this.add(view);
        }
        this.visible_child = view;
        view.grab_focus();
    },

    content_view_grab_focus: function () {
        if (this.visible_child) {
            this.visible_child.grab_focus();
        }
    },
});
