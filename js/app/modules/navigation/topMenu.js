// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenu */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

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
const TopMenu = new Module.Class({
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

    _init: function (props={}) {
        this.hexpand = true;
        this.parent(props);

        this._banner = this.create_submodule('banner');
        this._menu = this.create_submodule('menu');

        this.add(this._banner);
        this.add(this._menu);

        this.show_all();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
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

        let [, banner_nat_width] = this._banner.get_preferred_width();
        let [, menu_nat_width] = this._menu.get_preferred_width();
        let [, banner_nat_height] = this._banner.get_preferred_height();
        let [, menu_nat_height] = this._menu.get_preferred_height();

        let show_banner = (alloc.width >= banner_nat_width + menu_nat_width);

        let x = alloc.x;
        if (show_banner) {
            let banner_rect = new Gdk.Rectangle({
                x: x,
                y: alloc.y + _get_centered_coord(alloc.height, banner_nat_height),
                width: banner_nat_width,
                height: banner_nat_height,
            });
            this._banner.size_allocate(banner_rect);
            x += alloc.width - menu_nat_width;
        } else {
            x += Math.max(0, (alloc.width - menu_nat_width) / 2);
        }
        this._banner.set_child_visible(show_banner);

        let menu_rect = new Gdk.Rectangle({
            x: x,
            y: alloc.y + _get_centered_coord(alloc.height, menu_nat_height),
            width: Math.min(alloc.width, menu_nat_width),
            height: menu_nat_height,
        });
        this._menu.size_allocate(menu_rect);

        Utils.set_container_clip(this);
    },
});

function _get_centered_coord(total_height, module_height) {
    return (total_height - module_height) / 2;
}
