// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.search.utils;

/**
 * Section: Data directories
 * Determining where to find the app content
 */

/**
 * Function: get_data_dir
 * Searches for the EKN manifest for a knowledge engine domain
 *
 * Parameters:
 *   app_id - knowledge app ID, such as "com.endlessm.health-es".
 *
 * This function searches through the system data directories for an EKN
 * data directory for the given domain.
 *
 * Returns:
 *   a *Gio.File* pointing to an app content directory, or *null*.
 */
function get_data_dir(app_id) {
    function database_dir_from_data_dir(path) {
        let ekn_dir = Gio.File.new_for_path(path).get_child('ekn');
        let database_dir = ekn_dir.get_child('data').get_child(app_id);
        if (database_dir.query_exists(null))
            return database_dir;
        return null;
    }

    let data_dirs = [];

    // We may be asked for the data dir on behalf of another bundle, in
    // the search provider case -- so detect if we're under flatpak and
    // key off the app ID
    if (Utils.get_running_under_flatpak()) {
        let flatpak_relative_path = GLib.build_filenamev(['flatpak', 'app', app_id,
                                                          'current', 'active', 'files', 'share']);

        // Try the user flatpak location first
        data_dirs.push(GLib.build_filenamev([GLib.get_home_dir(), '.local', 'share',
                                                flatpak_relative_path]));

        // Try the system flatpak location next
        data_dirs.push(GLib.build_filenamev(['/var', 'lib',
                                                flatpak_relative_path]));

        // Try the split layout system flatpak location next
        data_dirs.push(GLib.build_filenamev(['/var', 'endless-extra',
                                                flatpak_relative_path]));
    }

    // Fall back to the XDG data dirs otherwise
    data_dirs = data_dirs.concat(GLib.get_system_data_dirs());

    // Check for an EKN database for the given domain at each datadir passed in,
    // in order of priority. If it is there, return the directory.
    for (let path of data_dirs) {
        let database_dir = database_dir_from_data_dir(path);
        if (database_dir)
            return database_dir;
    }
    return null;
}
