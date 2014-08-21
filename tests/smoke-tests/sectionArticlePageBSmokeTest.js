const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Lang = imports.lang;

EosKnowledge.init();

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
            new EosKnowledge.TextCard({title: 'The Democratic Transition'}),
            new EosKnowledge.TextCard({title: 'Independence'}),
            new EosKnowledge.TextCard({title: 'The Republic'}),
            new EosKnowledge.TextCard({title: 'Military Dictatorships'}),
            new EosKnowledge.TextCard({title: 'Civil War'}),
            new EosKnowledge.TextCard({title: 'The Democratic Transition'}),
            new EosKnowledge.TextCard({title: 'Independence'}),
            new EosKnowledge.TextCard({title: 'The Republic'}),
            new EosKnowledge.TextCard({title: 'Military Dictatorships'}),
            new EosKnowledge.TextCard({title: 'Civil War'}),
            new EosKnowledge.TextCard({title: 'The Democratic Transition'}),
            new EosKnowledge.TextCard({title: 'Independence'}),
            new EosKnowledge.TextCard({title: 'The Republic'}),
            new EosKnowledge.TextCard({title: 'Military Dictatorships'}),
            new EosKnowledge.TextCard({title: 'Civil War'}),
            new EosKnowledge.TextCard({title: 'The Democratic Transition'}),
            new EosKnowledge.TextCard({title: 'Independence'}),
            new EosKnowledge.TextCard({title: 'The Republic'}),
            new EosKnowledge.TextCard({title: 'Military Dictatorships'}),
            new EosKnowledge.TextCard({title: 'Civil War'}),
            new EosKnowledge.TextCard({title: 'The Democratic Transition'}),
        ];
        for (let card of cards) {
            card.connect('clicked', function () {
                section_article_page.show_article = true;
            });
        }

        let section_article_page = new EosKnowledge.SectionArticlePageB();
        section_article_page.section_page.title = 'History of Guatemala';
        section_article_page.section_page.cards = cards;
        section_article_page.article_page.switcher.load_uri('https://google.com', EosKnowledge.LoadingAnimationType.NONE);
        section_article_page.connect('back-clicked', function () {
            section_article_page.show_article = false;
        });

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(section_article_page, {
            background_uri: 'file://' + TESTDIR + '/test-content/background.jpg'
        });

        window.show_all();

    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
