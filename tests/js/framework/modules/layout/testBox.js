// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Box = imports.framework.modules.layout.box;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Box Layout Module', function () {
    let box, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [box, factory] = MockFactory.setup_tree({
            type: Box.Box,
            slots: {
                'contents': [
                    { type: null },
                    { type: null },
                ],
            },
        });
    });

    it('packs its children', function () {
        let [sidebar, content] = factory.get_created('contents');
        expect(box).toHaveDescendant(sidebar);
        expect(box).toHaveDescendant(content);
    });
});
