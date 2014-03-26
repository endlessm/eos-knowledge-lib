const _Gettext = imports.gettext;

const _Config = imports.config;

let _ = _Gettext.dgettext.bind(null, _Config.GETTEXT_PACKAGE);

/**
 * Function: hello_js
 * Stub description
 *
 * Stub.
 */
function hello_js() {
    print(hello_js_provider_get_greeting());
}

/**
 * Function: hello_js_provider_get_greeting
 * Stub description
 *
 * Stub.
 */
function hello_js_provider_get_greeting() {
    return _("Hello Javascript world!");
}
