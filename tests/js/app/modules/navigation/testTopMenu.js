// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const MockFactory = imports.tests.mockFactory;
const TopMenu = imports.app.modules.navigation.topMenu;
const Utils = imports.tests.utils;

describe('Navigation.TopMenu', function () {
let module, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();

        factory.add_named_mock('banner', Gtk.Frame);
        factory.add_named_mock('menu', Gtk.Frame);
        factory.add_named_mock('top-menu', TopMenu.TopMenu, {
            'banner': 'banner',
            'menu': 'menu',
        });
        module = factory.create_named_module('top-menu');
    });

    describe('sizing allocation', function () {
        let win;

        beforeEach(function () {
            win = new Gtk.OffscreenWindow();
            win.add(module);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        function testBannerVisibilityForDimensions(width, is_banner_visible) {
            let message = (is_banner_visible ? 'shows' : 'hides') + ' banner when width=' + width;

            it (message, function () {
                win.set_size_request(width, 60);
                Utils.update_gui();
            });
        }

        // Banner is visible when width=1000
        testBannerVisibilityForDimensions(1000, true);
        // Banner is visible when width=800
        testBannerVisibilityForDimensions(800, true);
        // Banner is hidden when width=700
        testBannerVisibilityForDimensions(700, false);
    });
});


