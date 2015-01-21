const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

/**
 * Section: Data directories
 * Determining where to find the Xapian database
 */

/**
 * Function: get_data_dir_for_domain
 * Searches for the EKN manifest for a knowledge engine domain
 *
 * Parameters:
 *   domain - knowledge engine domain, such as "health-es".
 *
 * This function searches through the system data directories for an EKN
 * manifest file for the given domain (at ekn/manifest/domain.json).
 * It returns a file handle to the first one that it finds.
 *
 * Returns:
 *   a *Gio.File* pointing to a Xapian database directory, or *null*.
 */
function get_data_dir_for_domain(domain) {
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
