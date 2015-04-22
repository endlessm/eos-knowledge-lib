const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

function parse_object_from_path (path) {
    let file = Gio.file_new_for_path(path);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}

function get_test_content_srcdir() {
    const SRCDIR = GLib.getenv('G_TEST_SRCDIR') || 'tests';
    return SRCDIR + '/test-content/';
}

function get_test_content_builddir() {
    const BUILDDIR = GLib.getenv('G_TEST_BUILDDIR') || GLib.get_current_dir() + '/tests';
    return BUILDDIR + '/test-content/';
}
