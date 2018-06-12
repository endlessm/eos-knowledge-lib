/* exported get_dominant_color */

const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

// Note: this is a temporary solution until the color extraction is done
// at build-time. The use of this function should be limited to specific cases,
// to avoid performance penalties.
function get_dominant_color (model) {
    if (!model.thumbnail_uri)
        throw new Error('Could not find thumbnail uri');

    let stream = Gio.File.new_for_uri(model.thumbnail_uri).read(null);

    let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
    return EosKnowledgePrivate.extract_pixbuf_dominant_color(pixbuf);
}
