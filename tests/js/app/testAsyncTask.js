const Gio = imports.gi.Gio;

const AsyncTask = imports.app.asyncTask;

describe('AsyncTask', function () {
    describe('callback function', function (done) {
        it('is always called asynchronously', function () {
            let spy = jasmine.createSpy('spy');
            spy.and.callThrough(() => {
                expect(true).toBe(true);
                done();
            });
            let task = new AsyncTask.AsyncTask({}, null, spy);
            task.return_value({});
            expect(spy).not.toHaveBeenCalled();
        });

        it('is called with source and task objects', function (done) {
            let source = {};
            let task = new AsyncTask.AsyncTask(source,
                                               null,
                                               (cb_source, cb_task) => {
                expect(cb_source).toBe(source);
                expect(cb_task).toBe(task);
                done();
            });
            task.return_value({});
        });

        it('is called after a cancel', function (done) {
            let cancellable = new Gio.Cancellable();
            new AsyncTask.AsyncTask({}, cancellable, () => {
                expect(true).toBe(true);
                done();
            });
            cancellable.cancel();
        });
    });

    describe('return function', function () {
        it('returns the object set by return_value', function (done) {
            let return_value = {};
            let task = new AsyncTask.AsyncTask({}, null, () => {
                expect(task.finish()).toBe(return_value);
                done();
            });
            task.return_value(return_value);
        });

        it('throws the error set by return_error', function (done) {
            let return_error = new Error('test error');
            let task = new AsyncTask.AsyncTask({}, null, () => {
                expect(() => { task.finish(); }).toThrowError('test error');
                done();
            });
            task.return_error(return_error);
        });

        it('throws an error after a cancel', function (done) {
            let cancellable = new Gio.Cancellable();
            let task = new AsyncTask.AsyncTask({}, cancellable, () => {
                expect(() => { task.finish(); }).toThrow();
                done();
            });
            cancellable.cancel();
        });

    });

    describe('catch_errors', function () {
        it('catches errors', function (done) {
            let error_fn = () => {
                throw new Error('test error');
            };
            let task = new AsyncTask.AsyncTask({}, null, () => {
                expect(() => { task.finish(); }).toThrowError('test error');
                done();
            });
            task.catch_errors(error_fn);
        });

        it('applies arguments to function', function () {
            let spy = jasmine.createSpy('spy');
            let task = new AsyncTask.AsyncTask({}, null, () => {});
            task.catch_errors(spy, 'foo', 'bar');
            expect(spy).toHaveBeenCalledWith('foo', 'bar');
        });
    });

    describe('catch_callback_errors', function () {
        it('catches errors in asynchronous callbacks', function (done) {
            let task = new AsyncTask.AsyncTask({}, null, () => {
                expect(() => { task.finish(); }).toThrowError('test error');
                done();
            });
            let error_cb = task.catch_callback_errors(() => {
                throw new Error('test error');
            });
            setTimeout(() => {
                error_cb();
            });
        });

        it('preserves callback arguments', function (done) {
            let spy = jasmine.createSpy('spy');
            let task = new AsyncTask.AsyncTask({}, null, () => {
                expect(spy).toHaveBeenCalledWith('foo', 'bar');
                done();
            });
            let cb = task.catch_callback_errors(spy);
            setTimeout(() => {
                cb('foo', 'bar');
                task.return_value({});
            });
        });
    });
});
