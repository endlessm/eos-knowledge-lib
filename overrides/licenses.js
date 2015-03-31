/* global private_imports */

const Gettext = imports.gettext;

const Config = private_imports.config;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

// The two "special" licenses. They should not show up in the hashes below, as
// they do not have links and are displayed as special cases.
const NO_LICENSE = 'No license';
const OWNER_PERMISSION = 'Owner permission';

// NOTE: The keys in these hashes are machine readable keys and should not be
// internationalized. Keep the keys in sync with
// eos-pantheon-tools/api/models/Feed.js for the database representation.

// These are the links to the full text or landing page belonging to each
// license. Note that it's not necessary to mark a link for translation if there
// is no internationalized version available. Currently we only have CC
// licenses, and those do have some internationalized versions.
const LICENSE_LINKS = {
    // TRANSLATORS: If this license page is translated into your language, you
    // can add a link to it here. For example, Spanish would be
    // https://creativecommons.org/licenses/by/4.0/es -- but make sure to check
    // that that page exists! If it does not exist, leave this untranslated.
    'CC-BY 4.0': _("https://creativecommons.org/licenses/by/4.0/"),
    // TRANSLATORS: If this license page is translated into your language, you
    // can add a link to it here. For example, Spanish would be
    // https://creativecommons.org/licenses/by-sa/4.0/es -- but make sure to check
    // that that page exists! If it does not exist, leave this untranslated.
    'CC-BY-SA 4.0': _("https://creativecommons.org/licenses/by-sa/4.0/"),
    // TRANSLATORS: If this license page is translated into your language, you
    // can add a link to it here. For example, Spanish would be
    // https://creativecommons.org/licenses/by/3.0/es -- but make sure to check
    // that that page exists! If it does not exist, leave this untranslated.
    'CC-BY 3.0': _("https://creativecommons.org/licenses/by/3.0/"),
    // TRANSLATORS: If this license page is translated into your language, you
    // can add a link to it here. For example, Spanish would be
    // https://creativecommons.org/licenses/by-sa/3.0/es -- but make sure to check
    // that that page exists! If it does not exist, leave this untranslated.
    'CC-BY-SA 3.0': _("https://creativecommons.org/licenses/by-sa/3.0/"),
};

// These are the human-readable versions of the license names.
const LICENSE_NAMES = {
    'CC-BY 4.0': _("CC-BY 4.0"),
    'CC-BY-SA 4.0': _("CC-BY-SA 4.0"),
    'CC-BY 3.0': _("CC-BY 3.0"),
    'CC-BY-SA 3.0': _("CC-BY-SA 3.0"),
};
