const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.sectionArticlePageSmokeTest';
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
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let the_section_article_page = new EosKnowledge.SectionArticlePageA({
            show_article: false
        });

        the_section_article_page.section_page.title = 'The Section';
        let card = new EosKnowledge.CardA({
            title: 'Picture Card',
            thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
        });
        the_section_article_page.section_page.segments = {
            'Lessons and Classes': [card]
        };

        the_section_article_page.article_page.title = 'Pig With A Hat';
        the_section_article_page.article_page.toc.section_list = ['A bell pepper hat'];

        card.connect('clicked', function() {
            the_section_article_page.show_article = true;
        });
        the_section_article_page.connect('back-clicked', function () {
            if (the_section_article_page.show_article)
                the_section_article_page.show_article = false;
            else
                print ('You want to go to the home page');
        });

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(the_section_article_page, {
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
