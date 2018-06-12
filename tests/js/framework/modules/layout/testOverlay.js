// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const MockFactory = imports.tests.mockFactory;
const Overlay = imports.framework.modules.layout.overlay;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.Overlay', function () {
    let overlay, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [overlay, factory] = MockFactory.setup_tree({
            type: Overlay.Overlay,
            slots: {
                'content': { type: null },
                'overlays': [
                    { type: null },
                    { type: null },
                ],
            },
        });
    });

    it('packs its children', function () {
        let [child] = factory.get_created('content');
        let [top1, top2] = factory.get_created('overlays');
        expect(overlay).toHaveDescendant(child);
        expect(overlay).toHaveDescendant(top1);
        expect(overlay).toHaveDescendant(top2);
        // FIXME should check the 'index' child property but that is not
        // currently possible in GJS
    });
});
