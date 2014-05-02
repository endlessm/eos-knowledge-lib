// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticlePageA = imports.articlePageA;
const HomePageA = imports.homePageA;
const SectionArticlePageA = imports.sectionArticlePageA;
const SectionPageA = imports.sectionPageA;

/**
 * Class: WindowA
 *
 * This represents the toplevel window widget for template A, containing all
 * template A pages.
 */
const WindowA = new Lang.Class({
    Name: 'WindowA',
    GTypeName: 'EknWindowA',
    Extends: Endless.Window,
    Properties: {
        /**
         * Property: home-page
         *
         * The <HomePageA> widget created by this widget. Read-only,
         * modify using the <HomePageA> API.
         */
        'home-page': GObject.ParamSpec.object('home-page', 'Home page',
            'The home page of this view widget.',
            GObject.ParamFlags.READABLE,
            HomePageA.HomePageA),
        /**
         * Property: section-page
         *
         * The <SectionPageA> widget created by this widget. Read-only,
         * modify using the <SectionPageA> API.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section page',
            'The section page of this view widget.',
            GObject.ParamFlags.READABLE,
            SectionPageA.SectionPageA),
        /**
         * Property: article-page
         *
         * The <ArticlePageA> widget created by this widget. Read-only,
         * modify using the <ArticlePageA> API.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article page',
            'The article page of this view widget.',
            GObject.ParamFlags.READABLE,
            ArticlePageA.ArticlePageA)
    },
    Signals: {
        /**
         * Event: back-clicked
         *
         * This event is triggered when the back button on the top bar is clicked.
         */
        'back-clicked': {},
        /**
         * Event: forward-clicked
         *
         * This event is triggered when the forward button on the top bar is clicked.
         */
        'forward-clicked': {},
        /**
         * Event: sidebar-back-clicked
         * Emitted when the back button on the side of the section or article
         * page is clicked.
         */
        'sidebar-back-clicked': {}
    },

    TRANSITION_DURATION: 500,

    _init: function (props) {
        this._home_page = new HomePageA.HomePageA();
        this._section_article_page = new SectionArticlePageA.SectionArticlePageA({
            section_page: new SectionPageA.SectionPageA(),
            article_page: new ArticlePageA.ArticlePageA()
        });
        this._section_article_page.connect('back-clicked', function () {
            this.emit('sidebar-back-clicked');
        }.bind(this));

        this.parent(props);

        let back_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-previous-symbolic',
                                                Gtk.IconSize.SMALL_TOOLBAR)
        });
        back_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TOPBAR_BACK_BUTTON);
        back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        let forward_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-next-symbolic',
                                                Gtk.IconSize.SMALL_TOOLBAR)
        });
        forward_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TOPBAR_FORWARD_BUTTON);
        forward_button.connect('clicked', function () {
            this.emit('forward-clicked');
        }.bind(this));
        let button_box = new Gtk.Box();
        button_box.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        button_box.add(back_button);
        button_box.add(forward_button);
        button_box.show_all();

        this.page_manager.add(this._home_page);
        this.page_manager.add(this._section_article_page, {
            left_topbar_widget: button_box
        });
        this.page_manager.transition_duration = this.TRANSITION_DURATION;
        this.page_manager.bind_property('transition-duration', this._section_article_page,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);
        this.show_all();
    },

    get home_page () {
        return this._home_page;
    },

    get section_page () {
        return this._section_article_page.section_page;
    },

    get article_page () {
        return this._section_article_page.article_page;
    },

    /**
     * Method: show_home_page
     *
     * This method causes the window to animate to the home page.
     */
    show_home_page: function () {
        this.page_manager.transition_type = Endless.PageManagerTransitionType.SLIDE_RIGHT;
        this.page_manager.visible_page = this._home_page;
    },

    /**
     * Method: show_section_page
     *
     * This method causes the window to animate to the section page.
     */
    show_section_page: function () {
        this.page_manager.transition_type = Endless.PageManagerTransitionType.SLIDE_LEFT;
        this._section_article_page.show_article = false;
        this.page_manager.visible_page = this._section_article_page;
    },

    /**
     * Method: show_article_page
     *
     * This method causes the window to animate to the article page.
     */
    show_article_page: function () {
        this.page_manager.transition_type = Endless.PageManagerTransitionType.SLIDE_LEFT;
        this._section_article_page.show_article = true;
        this.page_manager.visible_page = this._section_article_page;
    },

    /**
     * Method: get_visible_page
     *
     * Returns the currently visible page, either the home, section or article page.
     */
    get_visible_page: function () {
        let visible_page = this.page_manager.visible_page;
        if(visible_page === this._home_page)
            return visible_page;
        if(this._section_article_page.show_article)
            return this._section_article_page.article_page;
        else
            return this._section_article_page.section_page;
    }
});
