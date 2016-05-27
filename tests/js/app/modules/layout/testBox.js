// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Box = imports.app.modules.layout.box;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

describe('Box Layout Module', function () {
    let box, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-sidebar', Gtk.Label);
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('box-layout', Box.Box, {
            'contents': [
                'mock-sidebar',
                'mock-content',
            ],
        });
        box = factory.create_named_module('box-layout');
    });

    // FIXME: Will enable this once we can use module trees in tests
    xit('Packs its children', function () {
        let sidebar = factory.get_last_created_named_mock('mock-sidebar');
        let content = factory.get_last_created_named_mock('mock-content');
        expect(box).toHaveDescendant(sidebar);
        expect(box).toHaveDescendant(content);
    });
});
