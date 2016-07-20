// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Utils = imports.search.utils;

/**
 * Section: Data directories
 * Determining where to find the app content
 */

/**
 * Function: get_data_dir_for_domain
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
    let xdg_dir_paths = GLib.get_system_data_dirs();

    // Check for an EKN database for the given domain at each datadir passed in,
    // in order of priority. If it is there, return the directory.
    for (let path of xdg_dir_paths) {
        let ekn_dir = Gio.File.new_for_path(path).get_child('ekn');
        let database_dir = ekn_dir.get_child('data').get_child(app_id);
        if (database_dir.query_exists(null))
            return database_dir;
    }
    return null;
}
