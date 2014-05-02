const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.article-page';
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

        let article_page = new EosKnowledge.ArticlePageA({
            title: 'Big Old Title Thinger That Should Wrap',
            visible: true
        });

        article_page.toc.section_list = ['An article title',
                                         'A slightly longer article title',
                                         'What is this',
                                         'Blah ble blue blah blah fart blah blah blar',
                                         'The quick brown fox jumped over the small brown goat',
                                         'Yolo bolo folo molo tolo holo golo brumhilda',
                                         'Why why why why why',
                                         'An article title',
                                         'A slightly longer article title',
                                         'What is this',
                                         'Blah ble blue blah blah fart blah blah blar',
                                         'The quick brown fox jumped over the small brown goat',
                                         'Yolo bolo folo molo tolo holo golo brumhilda',
                                         'Why why why why why',
                                         'An article title',
                                         'A slightly longer article title',
                                         'What is this',
                                         'Blah ble blue blah blah fart blah blah blar',
                                         'The quick brown fox jumped over the small brown goat',
                                         'Yolo bolo folo molo tolo holo golo brumhilda'];
        article_page.toc.connect('section-clicked', function (widget, index) {
            article_page.toc.selected_section = index;
        });
        article_page.toc.connect('up-clicked', function () {
            article_page.toc.selected_section -= 1;
        });
        article_page.toc.connect('down-clicked', function () {
            article_page.toc.selected_section += 1;
        });
        article_page.switcher.load_uri('https://google.com');

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(article_page, {
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
