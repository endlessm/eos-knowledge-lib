const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Config = imports.app.config;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

let cc_licenses_path = Config.DATADIR + '/licenses/creativecommons/';
let cc_licenses_dir = Gio.File.new_for_path(cc_licenses_path);
let locale = _get_locale();

// The two "special" licenses. They should not show up in the hashes below, as
// they do not have links and are displayed as special cases.
const NO_LICENSE = 'No license';
const OWNER_PERMISSION = 'Owner permission';

// NOTE: The keys in these hashes are machine readable keys and should not be
// internationalized. Keep the keys in sync with
// eos-pantheon-tools/api/models/Feed.js for the database representation.

// These are the links to the full text files belonging to each
// license and installed in EOS shared directory.
const LICENSE_LINKS = {
    'CC-BY 4.0': _get_cc_license_path('CC-BY-4.0.html'),
    'CC-BY 3.0': _get_cc_license_path('CC-BY-3.0.html'),
    'CC-BY-SA 4.0': _get_cc_license_path('CC-BY-SA-4.0.html'),
    'CC-BY-SA 3.0': _get_cc_license_path('CC-BY-SA-3.0.html'),
};

// These are the human-readable versions of the license names.
const LICENSE_NAMES = {
    'CC-BY 4.0': _("CC-BY 4.0"),
    'CC-BY-SA 4.0': _("CC-BY-SA 4.0"),
    'CC-BY 3.0': _("CC-BY 3.0"),
    'CC-BY-SA 3.0': _("CC-BY-SA 3.0"),
};

function _get_locale() {
    let locales = GLib.get_language_names();
    let locale = 'C';

    locales.every((elem) => {
        let locale_subdir = cc_licenses_dir.get_child(elem);
        if(locale_subdir.query_exists(null)) {
            locale = elem;
            return false;
        }
        return true;
    });
    return locale;
}

function _get_cc_license_path(license_filename) {
    return cc_licenses_dir.get_child(locale).get_child(license_filename).get_uri();
}
