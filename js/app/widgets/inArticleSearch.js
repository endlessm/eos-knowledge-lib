// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

const ARTICLE_SEARCH_MAX_RESULTS = 200;

const InArticleSearch = new Knowledge.Class({
    Name: 'InArticleSearch',
    Extends: Gtk.Frame,

    Signals: {
        'stop-search': {},
    },

    _init: function(web_view) {
        this.parent({
            no_show_all: true,
        });

        this._web_view = web_view;

        this._search_entry = new Gtk.SearchEntry({
            hexpand: true,
            visible: true,
        });
        this._search_entry.connect('search-changed',
                                   this.search_changed.bind(this));
        this._search_entry.connect('key-press-event',
                                   this.on_key_press_event.bind(this));
        this._search_entry.connect('stop-search',
            () => this.emit('stop-search'));

        let entry_class = Utils.get_element_style_class(InArticleSearch, 'entry');
        this._search_entry.get_style_context().add_class(entry_class);


        let button_class = Utils.get_element_style_class(InArticleSearch, 'button');
        let next_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-down-symbolic',
                                                Gtk.IconSize.MENU),
        });
        next_button.connect('clicked', this.search_next.bind(this));
        next_button.get_style_context().add_class(button_class);

        let previous_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-up-symbolic',
                                                Gtk.IconSize.MENU),
        });
        previous_button.connect('clicked', this.search_previous.bind(this));
        previous_button.get_style_context().add_class(button_class);

        let close_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('window-close-symbolic',
                                                Gtk.IconSize.MENU),
        });
        close_button.connect('clicked', this.close.bind(this));
        close_button.get_style_context().add_class(button_class);

        let grid = new Gtk.Grid();
        grid.add(this._search_entry);
        grid.add(previous_button);
        grid.add(next_button);
        grid.add(close_button);
        grid.show_all();

        this.add(grid);
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
        if (!this.visible)
            return;

        this.hide();
        this._web_view.grab_focus();
        this._search_entry.set_text('');
        this._findController.search_finish();
    },

    open: function() {
        this.show();
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
