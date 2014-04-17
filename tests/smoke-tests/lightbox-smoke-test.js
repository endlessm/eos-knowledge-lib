const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.lightbox';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let button = new Gtk.Button({
            label: 'Click to show the lightbox'
        });
        button.connect('clicked', Lang.bind(this, function () {
            this._lightbox.reveal_overlays = true;
        }));

        let label = new Gtk.Label({
            label: "Don't eat my hat man.\nI'll mess you up"
        });
        label.show();

        let image = new Gtk.Image({
            file: TESTDIR + '/test-content/pig1.jpg'
        });
        image.show();

        this._lightbox = new EosKnowledge.Lightbox({
            lightbox_widget: image,
            infobox_widget: label
        });
        this._lightbox.add(button);

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(this._lightbox);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
