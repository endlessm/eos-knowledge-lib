const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.pages';
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
            new EosKnowledge.Card({
                title: 'Subtitled Card',
                subtitle: 'This is the Subtitle',
            }),
            new EosKnowledge.Card({
                title: 'Picture Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Everything card',
                subtitle: 'This card has everything',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.LessonCard({
                title: 'Mustard lesson',
                subtitle: 'Sample, incomplete',
                // By Bogdan29roman, CC-BY-SA
                // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
                item_index: 1,
                complete: false
            })
        ];

        let home_page = new EosKnowledge.HomePageA({
            title: 'Guatemala',
            subtitle: 'A country where Fernando is king'
        })
        home_page.cards = cards;

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(home_page);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
