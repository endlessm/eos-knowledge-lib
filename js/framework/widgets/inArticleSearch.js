// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;

const ARTICLE_SEARCH_MAX_RESULTS = 200;

var InArticleSearch = new Knowledge.Class({
    Name: 'InArticleSearch',
    Extends: Gtk.SearchBar,

    _init: function(web_view) {
        this.parent({
            no_show_all: true,
            show_close_button: true,
        });

        this._web_view = web_view;

        this._search_entry = new Gtk.SearchEntry({
            hexpand: true,
            visible: true,
        });
        this._search_entry.connect('search-changed',
                                   this.search_changed.bind(this));
        this._search_entry.connect('next-match', this.search_next.bind(this));
        this._search_entry.connect('previous-match',
            this.search_previous.bind(this));

        let entry_class = Utils.get_element_style_class(InArticleSearch, 'entry');
        this._search_entry.get_style_context().add_class(entry_class);

        let next_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-down-symbolic',
                                                Gtk.IconSize.MENU),
        });
        next_button.connect('clicked', this.search_next.bind(this));
        next_button.get_style_context().add_class(Utils.get_element_style_class(InArticleSearch, 'next'));

        let previous_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-up-symbolic',
                                                Gtk.IconSize.MENU),
        });
        previous_button.connect('clicked', this.search_previous.bind(this));
        previous_button.get_style_context().add_class(Utils.get_element_style_class(InArticleSearch, 'previous'));

        let grid = new Gtk.Grid();
        grid.add(this._search_entry);
        grid.add(previous_button);
        grid.add(next_button);
        grid.show_all();

        this.add(grid);
        this.connect_entry(this._search_entry);

        this.connect('notify::search-mode-enabled',
            this._on_search_mode_changed.bind(this));
    },

    search_changed: function() {
        this._findController.search(this._search_entry.text,
                                    WebKit2.FindOptions.CASE_INSENSITIVE |
                                    WebKit2.FindOptions.WRAP_AROUND,
                                    ARTICLE_SEARCH_MAX_RESULTS);
    },

    search_next: function() {
        this._findController.search_next();
    },

    search_previous: function() {
        this._findController.search_previous();
    },

    _on_search_mode_changed: function () {
        this.visible = this.search_mode_enabled;
        if (this.search_mode_enabled)
            this._findController = this._web_view.get_find_controller();
        else
            this._findController.search_finish();
    },
});
