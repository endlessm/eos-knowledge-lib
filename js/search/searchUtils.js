const GLib = imports.gi.GLib;

/* Returns the current locale's language code, or null if one cannot be found */
function get_current_language () {
    var locales = GLib.get_language_names();

    // we don't care about the last entry of the locales list, since it's
    // always 'C'. If we get there without finding a suitable language, return
    // null
    while (locales.length > 1) {
        var next_locale = locales.shift();

        // if the locale includes a country code or codeset (e.g. "en.utf8"),
        // skip it
        if (next_locale.indexOf('_') === -1 && next_locale.indexOf('.') === -1) {
            return next_locale;
        }
    }

    return null;
}

/*
 * Async control flow helper, roughly based on async parallel:
 * https://github.com/caolan/async#parallel
 * Takes in an object of keys mapping to task callbacks. Runs the tasks in
 * parallel, and calls into the finished function when all tasks are completed.
 * Each task is a potentially asynchronous function which takes in a done
 * callback with the usual (error, results) signature. The finished function
 * will be passed either an error or object of keys mapping to results of each
 * tasks. For example,
 * join_async({
 *   'first': function (done) { done(undefined, 'foo'); },
 *   'second': function (done) { done(undefined, 'bar'); },
 * }, function (error, results) { print(JSON.stringify(results)); });
 * will print out the object { 'first': 'foo', 'second': 'bar' }.
 */
function join_async (tasks, finished) {
    let keys = Object.keys(tasks);
    if (keys.length === 0) {
        finished(undefined, {});
        return;
    }
    let results = {};
    for (let key of keys) {
        tasks[key]((error, result) => {
            if (error) {
                finished(error);
                finished = function () {};
                return;
            }
            results[key] = result;
            if (Object.keys(results).length >= tasks.length) {
                finished(undefined, results);
            }
        });
    }
}
