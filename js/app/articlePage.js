// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;
const Cairo = imports.gi.cairo;

const StyleClasses = imports.app.styleClasses;

/**
 * Class: ArticlePage
 *
 * The article page of template A of the knowledge apps.
 *
 * There are three things that should be updated when displaying a new
 * article--the title, the table of contents and the article content widget
 * itself. For the first two use the <title> and <toc> properties, for the
 * latter the <switch_in_content_view> method.
 *
 * This widget will handle toggling the <TableOfContents.collapsed> parameter
 * of the table of contents depending on available space. It provides two
 * internal frames with style classes
 * StyleClasses.ARTICLE_PAGE_TOOLBAR_FRAME and
 * StyleClasses.ARTICLE_PAGE_SWITCHER_FRAME for theming purposes.
 * The toolbar frame surrounds the <title> and <toc> on the right. The
 * switcher frame surrounds the <switcher> on the left.
 */
const ArticlePage = new Lang.Class({
    Name: 'ArticlePage',
    GTypeName: 'EknArticlePage',
    Extends: Gtk.Frame,

    CONTENT_TRANSITION_DURATION: 500,

    _init: function (props) {
        this.parent(props);

        this._switcher = new Gtk.Stack({
            expand: true,
            transition_duration: this.CONTENT_TRANSITION_DURATION,
        });
        // Clear old views from the stack when its not animating.
        this._switcher.connect('notify::transition-running', function () {
            if (!this._switcher.transition_running) {
                for (let child of this._switcher.get_children()) {
                    if (child !== this._switcher.visible_child)
                        this._switcher.remove(child);
                }
            }
        }.bind(this));
        this.add(this._switcher)
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
            this._switcher.transition_type = Gtk.StackTransitionType.OVER_LEFT;
        } else if (animation_type === EosKnowledgePrivate.LoadingAnimation.BACKWARDS_NAVIGATION) {
            this._switcher.transition_type = Gtk.StackTransitionType.UNDER_RIGHT;
        } else {
            this._switcher.transition_type = Gtk.StackTransitionType.NONE;
        }

        view.show_all();
        if (view.get_parent() !== null) {
            view.reparent(this._switcher);
        } else {
            this._switcher.add(view);
        }
        this._switcher.visible_child = view;
        view.grab_focus();
        view.show_all();
    },

    content_view_grab_focus: function () {
        if (this._switcher.visible_child) {
            this._switcher.visible_child.grab_focus();
        }
    },
});
