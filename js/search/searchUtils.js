const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Datadir = imports.datadir;

/* Returns the current locale's language code, or null if one cannot be found */
function get_current_language () {
    var locales = GLib.get_language_names();

    // we don't care about the last entry of the locales list, since it's
    // always 'C'. If we get there without finding a suitable language, return
    // null
    while (locales.length > 1) {
        var next_locale = locales.shift();

        // if the locale includes a country code or codeset (e.g. "en.utf8"),
        // skip it
        if (next_locale.indexOf('_') === -1 && next_locale.indexOf('.') === -1) {
            return next_locale;
        }
    }

    return null;
}

function define_enum (values) {
    return values.reduce((obj, val, index) => {
        obj[val] = index;
        return obj;
    }, {});
}

function domain_from_ekn_id (ekn_id) {
    // Chop the URI off of an ekn id: 'ekn://football-es/hash' => 'football-es/hash'
    let stripped_ekn_id = ekn_id.slice('ekn://'.length);
    // Grab everything before the first slash.
    return stripped_ekn_id.split('/')[0];
}

// String operations
let parenthesize = (clause) => '(' + clause + ')';
let capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
let quote = (clause) => '"' + clause + '"';

/* Returns the EKN Version of the bundle with given domain. Defaults to 1 if
   no EKN_VERSION file is found. This function does synchronous file I/O. */
function get_ekn_version_for_domain (domain) {
    let dir = Datadir.get_data_dir_for_domain(domain);
    let ekn_version_file = dir.get_child('EKN_VERSION');
    try {
        let [success, contents, _] = ekn_version_file.load_contents(null);
        let version_string = contents.toString();
        return parseInt(version_string);
    } catch (e) {
        return 1;
    }
}
