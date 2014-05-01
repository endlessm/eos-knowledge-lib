// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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
    Extends: Gtk.Overlay,
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
            GObject.ParamFlags.READWRITE, false)
    },
    Signals: {
        /**
         * Event: back-clicked
         * This event is triggered when the Back button is clicked.
         */
        'back-clicked': {}
    },

    _ARROW_SIZE: 18,

    _init: function (props) {
        props = props || {};

        this._article_page = null;
        this._section_page = null;

        /*
         * Pages Stack
         */
        this._section_article_stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.SLIDE_LEFT,
            expand: true
        });

        this.parent(props);

        /*
         * Back button
         */
        let image = new Gtk.Image({
            icon_name: 'go-previous-symbolic',
            pixel_size: this._ARROW_SIZE
        });
        this._back_button = new Gtk.Button({
            image: image,
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER
        });
        this._back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        this._back_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_BACK_BUTTON);
        this._back_button.show_all();

        /*
         * Attach to page
         */
        this.add(this._section_article_stack);
        this.add_overlay(this._back_button);
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
    }
});
