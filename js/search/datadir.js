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
    function try_data_dir(domain) {
        let xdg_dir_paths = GLib.get_system_data_dirs();

        // We want to make sure we at least always search /endless/share.
        if (xdg_dir_paths.indexOf('/endless/share') === -1)
            xdg_dir_paths.push('/endless/share');

        // Check for an EKN database for the given domain at each datadir passed in,
        // in order of priority. If it is there, return the directory.
        let found_dir = null;
        xdg_dir_paths.some((path) => {
            let ekn_dir = Gio.File.new_for_path(path).get_child('ekn');
            let database_dir = ekn_dir.get_child('data').get_child(domain);
            if (database_dir.query_exists(null)) {
                found_dir = database_dir;
                return true;
            }
            return false;
        });
        return found_dir;
    }

    let data_dir;

    data_dir = try_data_dir(app_id);
    if (data_dir)
        return data_dir;

    let domain = Utils.domain_from_app_id(app_id);
    data_dir = try_data_dir(domain);
    if (data_dir)
        return data_dir;

    return null;
}
