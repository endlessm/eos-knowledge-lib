const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

/**
 * Class: AsyncTask
 *
 * A convenience class for writing Gio style asynchronous functions. Basically
 * like a GTask, but can be used in javascript with lots of goodies for easy
 * javascript error checking.
 *
 * At a high level, a task will have two functions <return_value> and
 * <return_error>, which will set our task result and then call into a callback
 * function, signaling that the task has run. Then the <finish> function can be
 * run to retrieve the result or error.
 *
 * Parameters:
 *   source - The source object, i.e. the object with the asynchronous function
 *   cancellable - A Gio.Cancellable, can be null
 *   callback - The function to call on task completion
 */
const AsyncTask = Lang.Class({
    Name: 'AsyncTask',
    GTypeName: 'EknAsyncTask',
    Extends: GObject.Object,

    _init: function (source, cancellable, callback, priority=GLib.PRIORITY_DEFAULT) {
        this.parent();

        this._source = source;
        this._callback = callback;
        this._done = false;
        this._priority = priority;

        if (cancellable) {
            let handle_cancel = () => {
                let error = GLib.Error.new_literal(Gio.io_error_quark(),
                                                   Gio.IOErrorEnum.CANCELLED,
                                                   'Async call cancelled');
                this.return_error(error);
            };
            if (cancellable.cancelled) {
                handle_cancel();
            } else {
                cancellable.connect(handle_cancel);
            }
        }
    },

    /**
     * Function: catch_errors
     *
     * Takes in a function and runs it inside of a try catch, calling
     * <return_error> on any error. Any parameters after the *fn* will be
     * applied as arguments to the *fn*.
     *
     * Parameters:
     *   fn - The function to call with error handling
     */
    catch_errors: function (fn) {
        if (this._done)
            return;
        try {
            fn.apply(this._source, Array.slice(arguments, 1));
        } catch (error) {
            this.return_error(error);
        }
    },

    /**
     * Function: catch_callback_errors
     *
     * Wraps a callback function inside of a second function, which will catch
     * all errors and call <return_error>.
     *
     * Parameters:
     *   fn - The callback to be wrapped inside an error handling function
     */
    catch_callback_errors: function (fn) {
        if (this._done)
            return () => {};
        let caller_stack = new Error().stack;
        // Remove this current stack frame
        caller_stack = caller_stack.split('\n').slice(1).join('\n');
        return () => {
            try {
                fn.apply(this._source, arguments);
            } catch (error) {
                error.stack += '--- Called from: ---\n' + caller_stack;
                this.return_error(error);
            }
        };
    },

    /**
     * Function: return_value
     *
     * Sets an object to be returned by the <finish> function. Will call into
     * the task callback function, signaling the task is complete.
     *
     * Parameters:
     *   object - The value to return in <finish>
     */
    return_value: function (object) {
        if (this._done)
            return;
        this._object = object;
        this._callback_in_idle();
    },

    /**
     * Function: return_error
     *
     * Sets an error to be thrown by the <finish> function. Will call into the
     * task callback function, signaling the task is complete.
     *
     * You probably want need to call this directly see <catch_errors> and
     * <catch_callback_errors>.
     *
     * Parameters:
     *   error - The error to throw in <finish>
     */
    return_error: function (error) {
        if (this._done)
            return;
        this._error = error;
        this._callback_in_idle();
    },

    _callback_in_idle: function () {
        this._done = true;
        GLib.idle_add(this._priority, () => {
            this._callback(this._source, this);
            return GLib.SOURCE_REMOVE;
        });
    },

    /**
     * Function: finish
     *
     * Returns the object set by <return_value>, or throws the error set by
     * <return_error>.
     */
    finish: function () {
        if (!this._done)
            throw new Error('Finish called, but async task not yet complete.');
        if (this._error)
            throw this._error;
        return this._object;
    },
});

// A perhaps silly way to emulate Promise.all using AsyncTask.
function all (source, func, cancellable, callback) {
    let task = new AsyncTask(source, cancellable, callback);

    let results = [];
    let waiting = 0;

    let subfuncs = [];

    func((add_task_func, finish) => {
        let task_idx = results.length;
        results.push(null);
        ++waiting;

        function task_callback(source, subtask) {
            let value = finish(subtask);
            results[task_idx] = value;
            if (--waiting === 0)
                task.return_value(results);
        }

        // Delay calling add_task_func until after we return from the main function
        // just in case one subtask resolves immediately...
        subfuncs.push(add_task_func.bind(null, cancellable, task.catch_callback_errors(task_callback)));
    });

    // Now go ahead and call the add_task_funcs.
    subfuncs.forEach((func) => func());

    // If we don't have any subfunctions, return immediately.
    if (subfuncs.length === 0)
        task.return_value([]);

    return task;
}

function all_finish (task) {
    return task.finish();
}
