const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardB = imports.app.cardB;
const HomePageB = imports.app.homePageB;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.pages';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const BACKGROUND_CSS = "EosWindow { \
    background-image: url('" + TESTDIR + "/test-content/background.jpg'); \
    background-size: 100% 100%; \
}";

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {
        this.parent();

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTDIR + '/test-content/test-content.gresource');
        resource._register();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        let background_provider = new Gtk.CssProvider();
        background_provider.load_from_data(BACKGROUND_CSS);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 background_provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let cards = [
            new CardB.CardB({
                title: 'Card 1',
                synopsis: 'The First Card',
                thumbnail_uri: TESTDIR + '/test-content/relish.jpg',
            }),
            new CardB.CardB({
                title: 'Card 2',
                synopsis: 'The Second Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new CardB.CardB({
                title: 'Card 3',
                synopsis: 'The Third Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new CardB.CardB({
                title: 'Card 4',
                synopsis: 'The Fourth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new CardB.CardB({
                title: 'Card 5',
                synopsis: 'The Fifth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new CardB.CardB({
                title: 'Card 6',
                synopsis: 'The Sixth Card',
                // By Bogdan29roman, CC-BY-SA
                // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                thumbnail_uri: TESTDIR + '/test-content/mustard.jpg'
            }),
            new CardB.CardB({
                title: 'Card 7',
                synopsis: 'The Seventh Card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new CardB.CardB({
                title: 'Card 8',
                synopsis: 'The Eighth Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            })
        ];

        let home_page = new HomePageB.HomePageB({
            title_image_uri: 'resource:///com/endlessm/thrones/agot.svg'
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
