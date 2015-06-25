imports.gi.versions.WebKit2 = '4.0';

const System = imports.system;

const Application = imports.app.application;

if (ARGV.length < 2) {
    printerr("Run this script by passing it an app ID and a gresource file");
    System.exit(1);
}

let app = new Application.Application({
    application_id: ARGV[0],
    inactivity_timeout: 12000,
});
// Gio assumes the first argument of the array is the name of the program being
// invoked. This is standard, but not done in gjs. So we stick ekn-app-runner to
// beginning of our arg list. We remove the two command line arguments handled in
// this script which we do not want to pass on to gapplication default handler.
app.run(['ekn-app-runner'].concat(ARGV.slice(2)));
