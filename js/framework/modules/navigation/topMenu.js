// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenu */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Actions = imports.framework.actions;
const Dispatcher = imports.framework.dispatcher;
const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Pages = imports.framework.pages;
const Utils = imports.framework.utils;

// FIXME: Should be responsive and change to 60 after a width threshold is crossed
const TOP_MENU_HEIGHT = 50;

/**
 * Class: TopMenu
 * Module that shows a banner and a top menu.
 *
 * This module shows two submodules: (1) a banner, typically a logo; (2) a horizontal
 * menu that includes all the options.
 *
 * When the module cannot accomodate both the banner and the menu, it hides the
 * banner.
 *
 * Implements:
 *   <Module>
 */
var TopMenu = new Module.Class({
    Name: 'Navigation.TopMenu',
    Extends: Endless.CustomContainer,

    Slots: {
        /**
         * Slot: banner
         * Typically an image previewer to display the logo
         */
        'banner': {},
        /**
         * Slot: menu
         * Module that contains the horizontal menu
         */
        'menu': {},
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();
        this._in_home_page = (item && item.page_type === Pages.HOME);

        if (this._in_home_page)
            Utils.unset_hand_cursor_on_widget(this._banner);
        else
            Utils.set_hand_cursor_on_widget(this._banner);
    },

    _on_banner_clicked: function () {
        if (this._in_home_page)
            return;

        Dispatcher.get_default().dispatch({
            action_type: Actions.HOME_CLICKED,
        });
    },

    _init: function (props={}) {
        this.hexpand = true;
        this.parent(props);

        this._banner = new Gtk.Button();
        this._banner.connect ('clicked', this._on_banner_clicked.bind(this));
        this._banner.add (this.create_submodule('banner'));
        this._menu = this.create_submodule('menu');

        this.add(this._banner);
        this.add(this._menu);

        this.show_all();

        HistoryStore.get_default().connect ('changed', this._on_history_changed.bind(this));
    },

    vfunc_get_preferred_width: function () {
        let [, banner_nat] = this._banner.get_preferred_width();
        let [menu_min, menu_nat] = this._menu.get_preferred_width();
        return [menu_min, banner_nat + menu_nat];
    },

    vfunc_get_preferred_height: function () {
        let [, banner_nat] = this._banner.get_preferred_height();
        let [, menu_nat] = this._menu.get_preferred_height();
        let height = Math.max(banner_nat, menu_nat, TOP_MENU_HEIGHT);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let rect = new Gdk.Rectangle(alloc);
        let [, banner_width] = this._banner.get_preferred_width();
        let [menu_width, ] = this._menu.get_preferred_width();

        /* Allocate banner */
        if (alloc.width >= menu_width + banner_width) {
            rect.width = banner_width;
            this._banner.size_allocate(rect);
            this._banner.set_child_visible(true);

            /* Allocate remaining space to menu */
            rect.x += banner_width;
            rect.width = alloc.width - banner_width;
        } else {
            this._banner.set_child_visible(false);
        }

        this._menu.size_allocate(rect);

        Utils.set_container_clip(this);
    },
});
