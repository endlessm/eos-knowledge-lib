const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Presenter = imports.app.presenter;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.presenter';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {

        this.parent();
        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTDIR + '/test-content/test-content.gresource');
        resource._register();

        let test_app_filename = 'file://' + TESTDIR + '/test-content/app.json';

        let presenter = new Presenter.Presenter(this, test_app_filename);
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
