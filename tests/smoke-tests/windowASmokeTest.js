const Endless = imports.gi.Endless;
const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.window';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const BACKGROUND_CSS = "EknWindowA { \
    background-image: url('" + TESTDIR + "/test-content/background.jpg'); \
    background-size: 100% 100%; \
}";

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
        let background_provider = new Gtk.CssProvider();
        background_provider.load_from_data(BACKGROUND_CSS);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 background_provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let view = new EosKnowledge.WindowA({
            application: this
        });
        view.connect('back-clicked', function () {
            if (view.get_visible_page() === view.article_page) {
                view.show_section_page();
            } else {
                view.show_home_page();
            }
        });
        view.connect('forward-clicked', function () {
            view.show_article_page();
        });
        view.connect('sidebar-back-clicked', function () {
            if (view.get_visible_page() === view.article_page) {
                view.show_section_page();
            } else {
                view.show_home_page();
            }
        });

        // ============ HOME PAGE ==================
        view.home_page.title = 'Guatemala';
        view.home_page.subtitle = 'A country where Fernando is king';
        view.home_page.cards = [
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
        for (let card of view.home_page.cards) {
            card.connect('clicked', function () {
                view.show_section_page();
            });
        }

        // ============ SECTION PAGE ==================
        view.section_page.title = 'History of Guatemala';
        view.section_page.segments = {
            'Lessons and Classes': [
                new EosKnowledge.Card({
                    title: 'Subtitled Card',
                    subtitle: 'This is the Subtitle',
                }),
                new EosKnowledge.Card({
                    title: 'Picture Card',
                    thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
                })
            ],
            'Articles and Files': [
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
                }),
                new EosKnowledge.LessonCard({
                    title: 'Ketchup lesson',
                    subtitle: 'No index',
                    // By Rachel Tayse, CC-BY
                    // http://en.wikipedia.org/wiki/File:Homemade_ketchup_canned_(4156502791).jpg
                    thumbnail_uri: TESTDIR + '/test-content/ketchup.jpg',
                    item_index: 0
                })
            ],
            'Devon and Higgins': [
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
            ],
            'Fernando and Frango': [
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
                }),
                new EosKnowledge.LessonCard({
                    title: 'Ketchup lesson',
                    subtitle: 'No index',
                    // By Rachel Tayse, CC-BY
                    // http://en.wikipedia.org/wiki/File:Homemade_ketchup_canned_(4156502791).jpg
                    thumbnail_uri: TESTDIR + '/test-content/ketchup.jpg',
                    item_index: 0
                }),
                new EosKnowledge.LessonCard({
                    title: 'Onion lessson',
                    subtitle: 'No index, completed',
                    // By Asb at the German language Wikipedia, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Rote_Zwiebeln_aufgeschnitten_asb_2004_PICT4222.JPG
                    thumbnail_uri: TESTDIR + '/test-content/onion.jpg',
                    item_index: 0,
                    complete: true
                })
            ]
        };
        for (let segment in view.section_page.segments) {
            for (let card of view.section_page.segments[segment]) {
                card.connect('clicked', function () {
                    view.show_article_page();
                });
            }
        }

        // ============ ARTICLE PAGE ==================
        view.article_page.title = 'Big Old Title Thinger That Should Wrap';
        view.article_page.toc.section_list = [
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
            'Yolo bolo folo molo tolo holo golo brumhilda',
            'Why why why why why',
            'An article title',
            'A slightly longer article title',
            'What is this',
            'Blah ble blue blah blah fart blah blah blar',
            'The quick brown fox jumped over the small brown goat',
            'Yolo bolo folo molo tolo holo golo brumhilda'];
        view.article_page.toc.connect('section-clicked', function (widget, index) {
            view.article_page.toc.selected_section = index;
        });
        view.article_page.toc.connect('up-clicked', function () {
            view.article_page.toc.selected_section -= 1;
        });
        view.article_page.toc.connect('down-clicked', function () {
            view.article_page.toc.selected_section += 1;
        });
        view.article_page.switcher.load_uri('https://en.wikipedia.org');

        // ============ LIGHTBOX ==================
        view.lightbox.lightbox_widget = new Gtk.Image({
            file: TESTDIR + '/test-content/onion.jpg',
            visible: true
        });
        view.connect('key-press-event', function () {
            view.lightbox.reveal_overlays = !view.lightbox.reveal_overlays;
        });

        view.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
