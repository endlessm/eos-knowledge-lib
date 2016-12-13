const ByteArray = imports.byteArray;
const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const AsyncTask = imports.search.asyncTask;

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

function define_enum (values) {
    return values.reduce((obj, val, index) => {
        obj[val] = index;
        return obj;
    }, {});
}

function components_from_ekn_id (ekn_id) {
    // The URI is of form 'ekn://domain/hash[/resource]'.
    // Domain is part of legacy bundle support and should not be used for
    // modern content.

    // Chop off our constant scheme identifier.
    let stripped_ekn_id = ekn_id.slice('ekn://'.length);

    let components = stripped_ekn_id.split('/');

    // Pop off the domain component.
    components.shift();

    return components;
}

function object_path_from_app_id (app_id) {
    return '/' + app_id.replace(/\./g, '/');
}

// String operations
let parenthesize = (clause) => '(' + clause + ')';
let capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
let quote = (clause) => '"' + clause + '"';

// number of bytes to read from the stream at a time (chosen rather arbitrarily
// to be 8KB)
const CHUNK_SIZE = 1024 * 8;

// asynchronously read an entire GInputStream
function read_stream (stream, cancellable, callback) {
    let task = new AsyncTask.AsyncTask(stream, cancellable, callback);
    task.catch_errors(() => {
        let total_read = '';
        let handle_byte_response = task.catch_callback_errors((stream, res) => {
            let bytes = stream.read_bytes_finish(res);
            total_read += bytes.get_data().toString();

            if (bytes.get_size() !== 0) {
                stream.read_bytes_async(CHUNK_SIZE, 0, cancellable, handle_byte_response);
            } else {
                task.return_value(total_read);
            }
        });
        stream.read_bytes_async(CHUNK_SIZE, 0, cancellable, handle_byte_response);
    });
}

function read_stream_finish (task) {
    return task.finish();
}

// synchronously read an entire GInputStream
function read_stream_sync (stream, cancellable = null) {
    try {
        let total_read = '';

        let buffer = stream.read_bytes(CHUNK_SIZE, cancellable);
        while (buffer.get_size() !== 0) {
            total_read += buffer.get_data().toString();
            buffer = stream.read_bytes(CHUNK_SIZE, cancellable);
        }
        total_read += buffer.get_data().toString();

        return total_read;
    } catch (error) {
        logError(error, 'Error reading ' + path);
        return undefined;
    }
}

function string_to_stream(string) {
    let bytes = ByteArray.fromString(string).toGBytes();
    return Gio.MemoryInputStream.new_from_bytes(bytes);
}

function ensure_directory (dir) {
    try {
        dir.make_directory_with_parents(null);
    } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {
        // Directory already exists, we're good.
    }
}

function get_subscriptions_dir () {
    let user_data_path;
    if (Eknc.get_running_under_flatpak()) {
        // When running under flatpak, GLib.get_user_data_dir() points to the
        // private home inside the application, not the real home.
        // Use the absolute path here instead of the utility function.
        user_data_path = GLib.build_filenamev([GLib.get_home_dir(), '.local', 'share']);
    } else {
        user_data_path = GLib.get_user_data_dir();
    }

    let path = GLib.build_filenamev([user_data_path, 'com.endlessm.subscriptions']);
    return Gio.File.new_for_path(path);
}
