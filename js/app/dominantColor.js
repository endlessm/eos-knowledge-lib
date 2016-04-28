// Copyright (C) 2016 Endless Mobile, Inc.

/* exported get_dominant_color, get_dominant_color_finish */

const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;

const AsyncTask = imports.search.asyncTask;
const Engine = imports.search.engine;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

// Note: this is a temporary solution until the color extraction is done
// at build-time. The use of this function should be limited to specific cases,
// to avoid performance penalties.
function get_dominant_color (model, cancellable, callback) {
    let task = new AsyncTask.AsyncTask(this, cancellable, callback);
    task.catch_errors(() => {
        if (!model.thumbnail_uri)
            throw new Error('Could not find thumbnail uri');
        if (model.thumbnail_uri.startsWith('ekn://')) {
            Engine.get_default().get_object_by_id(model.thumbnail_uri, cancellable, task.catch_callback_errors((engine, engine_task) => {
                let media_object = engine.get_object_by_id_finish(engine_task);
                let stream = media_object.get_content_stream();
                task.return_value(_extract_color(stream));
            }));
        } else {
            let stream = Gio.File.new_for_uri(model.thumbnail_uri).read(null);
            task.return_value(_extract_color(stream));
        }
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
