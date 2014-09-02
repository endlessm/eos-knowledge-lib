const EosKnowledge = imports.gi.EosKnowledge;

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.reader.done-page';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let page = new EosKnowledge.Reader.DonePage();
        page.progress_label.current_page = 15;
        page.progress_label.total_pages = 15;

        let window = new Endless.Window({
            application: this
        });
        window.page_manager.add(page);
        window.show_all();
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
