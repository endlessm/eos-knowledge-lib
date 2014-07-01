// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const BackButtonOverlay = imports.backButtonOverlay;
const SectionPageB = imports.sectionPageB;
const ArticlePage = imports.articlePage;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
    Extends: BackButtonOverlay.BackButtonOverlay,
    Properties: {
        /**
         * Property: section-page
         * The section page B created by this widget.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section Page',
            'The section page to be displayed',
            GObject.ParamFlags.READABLE, SectionPageB.SectionPageB.$gtype),
        /**
         * Property: article-page
         * The article page B created by this widget.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article Page',
            'The article page to be displayed',
            GObject.ParamFlags.READABLE, ArticlePage.ArticlePage.$gtype),
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

    _init: function (props) {
        this._section_page = new SectionPageB.SectionPageB();
        this._article_page = new ArticlePage.ArticlePage();
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
