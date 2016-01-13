// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const MockFactory = imports.tests.mockFactory;
const ResponsiveMarginsModule = imports.app.modules.responsiveMarginsModule;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Responsive margins module', function () {
    beforeEach(function () {
        this.factory = new MockFactory.MockFactory();
        this.factory.add_named_mock('content', Gtk.Label);
        this.factory.add_named_mock('module', ResponsiveMarginsModule.ResponsiveMarginsModule, {
            'content': 'content',
        });

        this.responsive_margins = new ResponsiveMarginsModule.ResponsiveMarginsModule({
            factory: this.factory,
            factory_name: 'module',
        });
    });

    it('constructs', function () {});

    testMarginsForDimensions(720, 0);
    testMarginsForDimensions(800, 40);
    testMarginsForDimensions(1100, 62);
    testMarginsForDimensions(1400, 83);
    testMarginsForDimensions(1600, 120);
});

function testMarginsForDimensions(total_width, margin) {
    let win;

    beforeEach(function () {
        win = new Gtk.OffscreenWindow();
    });

    afterEach(function () {
        win.destroy();
    });

    it ('sets margins for internal child to ' + margin + 'px when width=' + total_width, function () {
        win.add(this.responsive_margins);
        win.set_size_request(total_width, 100);
        win.show_all();

        win.queue_resize();
        Utils.update_gui();

        expect(this.responsive_margins.get_children()[0].margin_start).toBe(margin);
        expect(this.responsive_margins.get_children()[0].margin_end).toBe(margin);
    });
}
