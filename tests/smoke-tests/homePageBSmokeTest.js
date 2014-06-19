const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

EosKnowledge.init();

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
                title: 'Card 1',
                synopsis: 'The First Card',
                thumbnail_uri: TESTDIR + '/test-content/relish.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 2',
                synopsis: 'The Second Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 3',
                synopsis: 'The Third Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 4',
                synopsis: 'The Fourth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 5',
                synopsis: 'The Fifth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 6',
                synopsis: 'The Sixth Card',
                // By Bogdan29roman, CC-BY-SA
                // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                thumbnail_uri: TESTDIR + '/test-content/mustard.jpg'
            }),
            new EosKnowledge.Card({
                title: 'Card 7',
                synopsis: 'The Seventh Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Card 8',
                synopsis: 'The Eighth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            })
        ];

        let home_page = new EosKnowledge.HomePageB({
            title: 'Guatemala',
            subtitle: 'The Land of Eternal Spring'
        });
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
