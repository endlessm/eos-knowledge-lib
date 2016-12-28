/* exported get_dominant_color, get_dominant_color_finish */

const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;

const AsyncTask = imports.app.asyncTask;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

// Note: this is a temporary solution until the color extraction is done
// at build-time. The use of this function should be limited to specific cases,
// to avoid performance penalties.
function get_dominant_color (model, cancellable, callback) {
    let task = new AsyncTask.AsyncTask(this, cancellable, callback);
    task.catch_errors(() => {
        if (!model.thumbnail_uri)
            throw new Error('Could not find thumbnail uri');

        let stream = Gio.File.new_for_uri(model.thumbnail_uri).read(null);
        task.return_value(_extract_color(stream));
    });
    return task;
}

function get_dominant_color_finish (task) {
    return task.finish();
}

function _extract_color (stream) {
    let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
    return EosKnowledgePrivate.extract_pixbuf_dominant_color(pixbuf);
}
