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

        let segments = {

            'Lessons and Classes': [
                new EosKnowledge.CardA({
                    title: 'Subtitled Card',
                    synopsis: 'This is the Subtitle',
                }),
                new EosKnowledge.CardA({
                    title: 'Picture Card',
                    thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
                })
            ],

            'Articles and Files': [
                new EosKnowledge.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),
                new EosKnowledge.LessonCard({
                    title: 'Mustard lesson',
                    synopsis: 'Sample, incomplete',
                    // By Bogdan29roman, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                    thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
                    item_index: 1,
                    complete: false
                }),

                new EosKnowledge.LessonCard({
                    title: 'Ketchup lesson',
                    synopsis: 'No index',
                    // By Rachel Tayse, CC-BY
                    // http://en.wikipedia.org/wiki/File:Homemade_ketchup_canned_(4156502791).jpg
                    thumbnail_uri: TESTDIR + '/test-content/ketchup.jpg',
                    item_index: 0
                })
            ],

            'Devon and Higgins': [
                new EosKnowledge.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),
                new EosKnowledge.LessonCard({
                    title: 'Mustard lesson',
                    synopsis: 'Sample, incomplete',
                    // By Bogdan29roman, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                    thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
                    item_index: 1,
                    complete: false
                })
            ],

            'Fernando and Frango': [
                new EosKnowledge.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),

                new EosKnowledge.LessonCard({
                    title: 'Mustard lesson',
                    synopsis: 'Sample, incomplete',
                    // By Bogdan29roman, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                    thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
                    item_index: 1,
                    complete: false
                }),

                new EosKnowledge.LessonCard({
                    title: 'Ketchup lesson',
                    synopsis: 'No index',
                    // By Rachel Tayse, CC-BY
                    // http://en.wikipedia.org/wiki/File:Homemade_ketchup_canned_(4156502791).jpg
                    thumbnail_uri: TESTDIR + '/test-content/ketchup.jpg',
                    item_index: 0
                }),

                new EosKnowledge.LessonCard({
                    title: 'Onion lessson',
                    synopsis: 'No index, completed',
                    // By Asb at the German language Wikipedia, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Rote_Zwiebeln_aufgeschnitten_asb_2004_PICT4222.JPG
                    thumbnail_uri: TESTDIR + '/test-content/onion.jpg',
                    item_index: 0,
                    complete: true
                }),

                new EosKnowledge.LessonCard({
                    title: 'Onion lessson',
                    synopsis: 'No index, completed',
                    // By Asb at the German language Wikipedia, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Rote_Zwiebeln_aufgeschnitten_asb_2004_PICT4222.JPG
                    thumbnail_uri: TESTDIR + '/test-content/onion.jpg',
                    item_index: 0,
                    complete: true
                }),

                new EosKnowledge.LessonCard({
                    title: 'Onion lessson',
                    synopsis: 'No index, completed',
                    // By Asb at the German language Wikipedia, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Rote_Zwiebeln_aufgeschnitten_asb_2004_PICT4222.JPG
                    thumbnail_uri: TESTDIR + '/test-content/onion.jpg',
                    item_index: 0,
                    complete: true
                }),

                new EosKnowledge.LessonCard({
                    title: 'Onion lessson',
                    synopsis: 'No index, completed',
                    // By Asb at the German language Wikipedia, CC-BY-SA
                    // http://en.wikipedia.org/wiki/File:Rote_Zwiebeln_aufgeschnitten_asb_2004_PICT4222.JPG
                    thumbnail_uri: TESTDIR + '/test-content/onion.jpg',
                    item_index: 0,
                    complete: true
                })
            ]
        }

        let section_page = new EosKnowledge.SectionPageA({
            title: 'History of Guatemala'
        })
        section_page.segments = segments;

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
