// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const NavButtonOverlay = imports.app.navButtonOverlay;
const SectionPageA = imports.app.sectionPageA;
const SectionPageB = imports.app.sectionPageB;
const ArticlePage = imports.app.articlePage;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: SectionArticlePage
 *
 * Superclass for section page/article page pairs
 */
const SectionArticlePage = new Lang.Class({
    Name: 'SectionArticlePage',
    GTypeName: 'EknSectionArticlePage',
    Extends: NavButtonOverlay.NavButtonOverlay,
    Properties: {
        /**
         * Property: section-page
         * The section page to be displayed by the page manager.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section Page',
            'The section page to be displayed',
            GObject.ParamFlags.READABLE, GObject.Object),
        /**
         * Property: article-page
         * The article page to be displayed by the page manager.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article Page',
            'The article page to be displayed',
            GObject.ParamFlags.READABLE, GObject.Object),
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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, GLib.MAXUINT32, 200)

    },

    get section_page () {
        return this._section_page;
    },

    get article_page () {
        return this._article_page;
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
    Extends: SectionArticlePage,

    _init: function (props) {
        props = props || {};
        props.forward_visible = false;

        this._section_page = new SectionPageA.SectionPageA();
        this._article_page = new ArticlePage.ArticlePage();
        this._transition_duration = 0;

        /*
         * Pages Stack
         */
        this._section_article_stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.SLIDE_LEFT,
            expand: true
        });
        this._section_article_stack.connect('notify::transition-running', function () {
            if (this._section_article_stack.transition_running) {
                this.get_style_context().add_class(EosKnowledgePrivate.STYLE_CLASS_ANIMATING);
            } else {
                this.get_style_context().remove_class(EosKnowledgePrivate.STYLE_CLASS_ANIMATING);
            }
        }.bind(this));
        this._section_article_stack.add(this._section_page);
        this._section_article_stack.add(this._article_page);
        this.parent(props);

        this.bind_property('transition-duration', this._section_article_stack,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        /*
         * Attach to page
         */
        this.add(this._section_article_stack);
    },

    get show_article () {
        return this._show_article;
    },

    set show_article (v) {
        if (this._show_article === v)
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
});

/**
 * Class: SectionArticlePageB
 *
 * This class is a page manager for a section and article pair.
 * It has a <section-page>, <article-page>, and a boolean variable, <show-article>
 * to toggle the display of the article plage.
 */
const SectionArticlePageB = new Lang.Class({
    Name: 'SectionArticlePageB',
    GTypeName: 'EknSectionArticlePageB',
    Extends: SectionArticlePage,

    _init: function (props) {
        props = props || {};
        props.forward_visible = false;
        this._section_page = new SectionPageB.SectionPageB();
        this._article_page = new ArticlePage.ArticlePage({
            show_top_title: false
        });
        this._article_page.toc.hide();
        this._article_page.has_margins = false;
        this._transition_duration = 0;

        this._article_page_revealer = new Gtk.Revealer({
            reveal_child: false,
            transition_type: Gtk.RevealerTransitionType.SLIDE_LEFT,
            expand: false
        });
        this._article_page_revealer.add(this._article_page);

        this.parent(props);


        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        grid.add(this._section_page);
        grid.add(this._article_page_revealer);

        this.bind_property('transition-duration', this._article_page_revealer,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('transition-duration', this._section_page,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        this.add(grid);
    },

    get show_article () {
        return this._show_article;
    },

    set show_article (v) {
        if (this._show_article === v)
            return;

        this._show_article = v;
        if (this._show_article) {
            this._article_page_revealer.reveal_child = true;
            this._article_page_revealer.expand = true;
            this._section_page.collapsed = true;
            this._section_page.expand = false;
        } else {
            this._article_page_revealer.expand = false;
            this._article_page_revealer.reveal_child = false;
            this._section_page.collapsed = false;
            this._section_page.expand = true;
        }
        this.notify('show-article');
    },
});
