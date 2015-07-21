// Copyright 2015 Endless Mobile, Inc.

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
        dispatcher.quit();
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
});
