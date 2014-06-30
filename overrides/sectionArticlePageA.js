// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const BackButtonOverlay = imports.backButtonOverlay;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: SectionArticlePageA
 *
 * This class is a page manager for a section and article pair.
 * It has a <section-page>, <article-page>, and a boolean variable, <show-article> 
 * to toggle the display of the article plage.
 */
const SectionArticlePageA = new Lang.Class({
    Name: 'SectionArticlePageA',
    GTypeName: 'EknSectionArticlePageA',
    Extends: BackButtonOverlay.BackButtonOverlay,
    Properties: {
        /**
         * Property: section-page
         * The section page to be displayed by the page manager.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section Page',
            'The section page to be displayed',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        /**
         * Property: article-page
         * The article page to be displayed by the page manager.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article Page',
            'The article page to be displayed',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        /**
         * Property: show-article
         * Whether the article page should be displayed
         */
        'show-article': GObject.ParamSpec.boolean('show-article', 'Show Article',
            'Boolean property to show whether the article should be shown. Defaults to false',
            GObject.ParamFlags.READWRITE, false),
        /**
         * Property: transition-duration
         * Specifies the duration of the transition between pages
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration', 'Transition Duration',
            'Specifies (in ms) the duration of the transition between pages.',
            GObject.ParamFlags.READWRITE, 0, GLib.MAXUINT32, 200)

    },

    _init: function (props) {
        props = props || {};

        this._article_page = null;
        this._section_page = null;
        this._transition_duration = 0;

        /*
         * Pages Stack
         */
        this._section_article_stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.SLIDE_LEFT,
            expand: true
        });
        this.parent(props);

        this.bind_property('transition-duration', this._section_article_stack,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        /*
         * Attach to page
         */
        this.add(this._section_article_stack);
    },

    set section_page (v) {
        this._section_page = v;
        this._section_article_stack.add(this._section_page);
        this.notify('section-page');
    },

    set article_page (v) {
        this._article_page = v;
        this._section_article_stack.add(this._article_page);
        this.notify('article-page');
    },

    set show_article (v) {
        if (this._show_article === v)
            return;

        if (this._article_page === null || this._section_page === null)
            return;

        this._show_article = v;
        if (this._show_article) {
            this._section_article_stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            this._section_article_stack.visible_child = this._article_page;
        } else {
            this._section_article_stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            this._section_article_stack.visible_child = this._section_page;
        }
        this.notify('show-article');
    },

    get section_page () {
        return this._section_page;
    },

    get article_page () {
        return this._article_page;
    },

    get show_article () {
        return this._show_article;
    },

    set transition_duration (v) {
        if (this._transition_duration === v)
            return;
        this._transition_duration = v;
        this.notify('transition-duration');
    },

    get transition_duration () {
        return this._transition_duration;
    }
});
