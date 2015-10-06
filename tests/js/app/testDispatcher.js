// Copyright 2015 Endless Mobile, Inc.
const GLib = imports.gi.GLib;

const Dispatcher = imports.app.dispatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Dispatcher', function () {
    let dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        dispatcher = new Dispatcher.Dispatcher();
        dispatcher.start();
    });

    afterEach(function () {
        dispatcher.stop();
    });

    it('get_default always returns the same dispatcher', function () {
        expect(Dispatcher.get_default()).toBeA(Dispatcher.Dispatcher);
        expect(Dispatcher.get_default()).toBe(Dispatcher.get_default());
    });

    describe('dispatch function', function () {
        it('calls all registered callbacks with all payloads', function (done) {
            let spy1 = jasmine.createSpy();
            let spy2 = jasmine.createSpy();
            let foo_load = {
                action_type: 'foo',
            };
            let bar_load = {
                action_type: 'bar',
            };
            let check_finished = () => {
                if (spy1.calls.count() === 2 && spy2.calls.count() === 2) {
                    expect(spy1).toHaveBeenCalledWith(foo_load);
                    expect(spy1).toHaveBeenCalledWith(bar_load);
                    expect(spy2).toHaveBeenCalledWith(foo_load);
                    expect(spy2).toHaveBeenCalledWith(bar_load);
                    done();
                }
            };
            spy1.and.callFake(check_finished);
            spy2.and.callFake(check_finished);
            dispatcher.register(spy1);
            dispatcher.register(spy2);
            dispatcher.dispatch(foo_load);
            dispatcher.dispatch(bar_load);
        });

        it('does not call unregistered callbacks', function (done) {
            let spy = jasmine.createSpy();
            let id = dispatcher.register(spy);
            dispatcher.unregister(id);
            dispatcher.dispatch({
                action_type: 'foo',
            });
            setTimeout(() => {
                expect(spy).not.toHaveBeenCalled();
                done();
            });
        });

        it('calls callbacks in an idle', function (done) {
            let spy = jasmine.createSpy().and.callFake(done);
            dispatcher.register(spy);
            dispatcher.dispatch({
                action_type: 'foo',
            });
            expect(spy).not.toHaveBeenCalled();
        });

        it('errors if no action_type in payload', function () {
            expect(() => dispatcher.dispatch({})).toThrow();
        });
    });

    describe('resetting', function () {
        it('unregisters all callbacks', function (done) {
            let spy1 = jasmine.createSpy();
            let spy2 = jasmine.createSpy();
            dispatcher.register(spy1);
            dispatcher.register(spy2);
            dispatcher.reset();
            dispatcher.start();
            dispatcher.dispatch({
                action_type: 'foo',
            });
            GLib.idle_add(GLib.PRIORITY_LOW, () => {
                expect(spy1).not.toHaveBeenCalled();
                expect(spy2).not.toHaveBeenCalled();
                done();
            });
        });

        it('clears the queue of pending actions', function (done) {
            dispatcher.dispatch({
                action_type: 'foo',
            });
            dispatcher.reset();
            dispatcher.start();
            let spy = jasmine.createSpy();
            dispatcher.register(spy);
            GLib.idle_add(GLib.PRIORITY_LOW, () => {
                expect(spy).not.toHaveBeenCalled();
                done();
            });
        });
    });
});

// Spying on GLib.source_remove is unfortunately an implementation detail.
describe('Dispatcher start and stop', function () {
    let dispatcher;

    beforeEach(function () {
        spyOn(GLib, 'source_remove').and.callThrough();
        dispatcher = new Dispatcher.Dispatcher();
    });

    it('does not start twice if calling start() twice', function (done) {
        dispatcher.start();
        let spy = jasmine.createSpy();
        dispatcher.register(spy);
        dispatcher.start();
        dispatcher.stop();
        dispatcher.dispatch({
            action_type: 'foo',
        });
        GLib.idle_add(GLib.PRIORITY_LOW, () => {
            expect(spy).not.toHaveBeenCalled();
            expect(GLib.source_remove.calls.count()).toEqual(1);
            done();
            return GLib.SOURCE_REMOVE;
        });
    });

    it('does not stop twice if calling stop() twice', function () {
        dispatcher.start();
        dispatcher.stop();
        dispatcher.stop();
        expect(GLib.source_remove.calls.count()).toEqual(1);
    });
});
