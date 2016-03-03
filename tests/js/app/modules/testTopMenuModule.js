// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const MockFactory = imports.tests.mockFactory;
const TopMenuModule = imports.app.modules.topMenuModule;
const Utils = imports.tests.utils;

describe('TopMenu module', function () {
let module, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();

        factory.add_named_mock('banner', Gtk.Frame);
        factory.add_named_mock('menu', Gtk.Frame);
        factory.add_named_mock('top-menu', TopMenuModule.TopMenuModule, {
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


