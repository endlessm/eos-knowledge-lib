// Copyright (C) 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

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

function register_gresource() {
    const BUILDDIR = GLib.getenv('G_TEST_BUILDDIR') || GLib.get_current_dir() + '/tests';
    let resource = Gio.Resource.load(BUILDDIR + '/../eos-knowledge.gresource');
    resource._register();
}

function update_gui () {
    while (Gtk.events_pending())
        Gtk.main_iteration(false);
}

// A provider which reset all theme. Useful for testing sizing, e.g.
function create_reset_provider () {
    let provider = new Gtk.CssProvider();
    provider.load_from_data('* { all: unset; }');
    return provider;
}
