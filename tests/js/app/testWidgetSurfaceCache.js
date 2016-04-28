// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
const WidgetSurfaceCache = imports.app.widgetSurfaceCache;

Gtk.init(null);

describe('Surface cache', function () {
    let widget, cache, offscreen, draw_spy;

    beforeEach(function () {
        offscreen = new Gtk.OffscreenWindow();
        widget = new Gtk.Label();
        offscreen.add(widget);
        offscreen.show_all();

        draw_spy = jasmine.createSpy();
        cache = new WidgetSurfaceCache.WidgetSurfaceCache(widget, draw_spy);
        spyOn(cache, 'invalidate').and.callThrough();
    });

    it('returns a cairo surface', function () {
        expect(cache.get_surface()).toBeDefined();
    });

    it('caches draw results', function () {
        cache.get_surface();
        cache.get_surface();
        expect(draw_spy.calls.count()).toBe(1);
    });

    it('redraws after invalide is called', function () {
        cache.get_surface();
        cache.invalidate();
        cache.get_surface();
        expect(draw_spy.calls.count()).toBe(2);
    });

    it('invalidates on unmap', function () {
        offscreen.hide();
        Utils.update_gui();
        expect(cache.invalidate).toHaveBeenCalled();
    });
});
