// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const MockFactory = imports.tests.mockFactory;
const TopMenu = imports.framework.modules.navigation.topMenu;

describe('Navigation.TopMenu', function () {
    let module;

    beforeEach(function () {
        [module] = MockFactory.setup_tree({
            type: TopMenu.TopMenu,
            slots: {
                'banner': { type: null },
                'menu': { type: null },
            },
        });
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


