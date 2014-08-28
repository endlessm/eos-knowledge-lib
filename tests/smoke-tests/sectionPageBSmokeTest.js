const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.section-page';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let cards = [
            new EosKnowledge.TextCard({title: 'The Mayan Culture'}),
            new EosKnowledge.TextCard({title: 'Colapse of the Mayans'}),
            new EosKnowledge.TextCard({title: 'Arrival of the Spaniards'}),
            new EosKnowledge.TextCard({title: 'The Colonial Era'}),
            new EosKnowledge.TextCard({title: 'Independence'}),
            new EosKnowledge.TextCard({title: 'The Republic'}),
            new EosKnowledge.TextCard({title: 'Military Dictatorships'}),
            new EosKnowledge.TextCard({title: 'Civil War'}),
            new EosKnowledge.TextCard({title: 'The Democratic Transition'})
        ];

        let section_page = new EosKnowledge.SectionPageB({
            title: 'History of Guatemala'
        });
        section_page.cards = cards;

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(section_page);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
