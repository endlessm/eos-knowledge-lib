const Gio = imports.gi.Gio;

function parse_object_from_path (path) {
    let file = Gio.file_new_for_path(path);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}
