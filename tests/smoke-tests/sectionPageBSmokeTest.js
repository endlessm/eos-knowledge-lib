const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TextCard = imports.app.textCard;
const SectionPageB = imports.app.sectionPageB;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.section-page';
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

        let cards = [
            new TextCard.TextCard({title: 'The Mayan Culture'}),
            new TextCard.TextCard({title: 'Colapse of the Mayans'}),
            new TextCard.TextCard({title: 'Arrival of the Spaniards'}),
            new TextCard.TextCard({title: 'The Colonial Era'}),
            new TextCard.TextCard({title: 'Independence'}),
            new TextCard.TextCard({title: 'The Republic'}),
            new TextCard.TextCard({title: 'Military Dictatorships'}),
            new TextCard.TextCard({title: 'Civil War'}),
            new TextCard.TextCard({title: 'The Democratic Transition'})
        ];

        let section_page = new SectionPageB.SectionPageB({
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
