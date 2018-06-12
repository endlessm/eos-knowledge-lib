// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;

const ToggleTweener = imports.framework.toggleTweener;

describe('Toggle tweener', function () {
    let widget, tweener, tick, clock;

    beforeEach(function () {
        clock = jasmine.createSpyObj('clock', ['get_frame_time']);
        clock.get_frame_time.and.returnValue(0);
        widget = jasmine.createSpyObj('widget', ['get_frame_clock', 'add_tick_callback', 'queue_draw']);
        widget.add_tick_callback.and.callFake((callback) => {
            tick = (elapsed) => {
                tweener.set_active(true);
                // frame clock in microseconds
                clock.get_frame_time.and.returnValue(elapsed * 1000);
                return callback(widget, clock);
            };
        });
        widget.get_frame_clock.and.returnValue(clock);

        tweener = new ToggleTweener.ToggleTweener(widget, {
            transition_duration: 10,
            inactive_value: 20,
            active_value: 30,
        });
    });

    it('add a tick callback when active is changed', function () {
        tweener.set_active(true);
        expect(widget.add_tick_callback).toHaveBeenCalled();
    });

    it('removes tick callback when target is reached', function () {
        tweener.set_active(true);
        expect(tick(5)).toBe(GLib.SOURCE_CONTINUE);
        expect(tick(10)).toBe(GLib.SOURCE_REMOVE);
    });

    it('calls queue draw after value changed', function () {
        tweener.set_active(true);
        tick(1);
        expect(widget.queue_draw).toHaveBeenCalled();
    });

    it('interpolates between inactive and active value', function () {
        expect(tweener.get_value()).toBe(20);
        tweener.set_active(true);
        tick(10);
        expect(tweener.get_value()).toBe(30);
    });

    it('interpolates based on time elapsed', function () {
        tweener.set_active(true);
        tick(5);
        expect(tweener.get_value()).toBe(25);
    });
});
