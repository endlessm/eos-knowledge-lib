const ByteArray = imports.byteArray;
const Gio = imports.gi.Gio;

const AsyncTask = imports.search.asyncTask;

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
