// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ARTICLE_SEARCH_BUTTONS_SPACING = 10;
const ARTICLE_SEARCH_MAX_RESULTS = 200;

const InArticleSearch = new Lang.Class({
    Name: 'ArticleSearch',
    Extends: Gtk.Grid,

    _init: function(web_view) {
        this.parent({
            column_spacing: ARTICLE_SEARCH_BUTTONS_SPACING
        });

        this._web_view = web_view;

        this._search_entry = new Gtk.SearchEntry({
            hexpand: true
        });
        this._search_entry.connect('search-changed',
                                   this.search_changed.bind(this));
        this._search_entry.connect('key-press-event',
                                   this.on_key_press_event.bind(this));

        this._next_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-down-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._next_button.connect('clicked', this.search_next.bind(this));

        this._previous_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-up-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._previous_button.connect('clicked',
                                      this.search_previous.bind(this));

        this._close_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('window-close-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._close_button.connect('clicked', this.close.bind(this));

        this.attach(this._search_entry, 0, 0, 1, 1);
        this.attach(this._next_button, 1, 0, 1, 1);
        this.attach(this._previous_button, 2, 0, 1, 1);
        this.attach(this._close_button, 3, 0, 1, 1);
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

    close: function() {
        this.hide();

        this._web_view.grab_focus();
        this._search_entry.set_text('');
        this._findController.search_finish();
    },

    open: function() {
        this.show_all();
        this._search_entry.grab_focus();
        this._findController = this._web_view.get_find_controller();
    },

    on_key_press_event: function(widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        if ((state & Gdk.ModifierType.SHIFT_MASK !== 0) &&
             keyval === Gdk.KEY_Return) {
            this.search_previous();
        } else if (keyval === Gdk.KEY_Return) {
            this.search_next();
        }
    }
});
