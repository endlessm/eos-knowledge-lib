const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardA = imports.app.cardA;
const SectionPageA = imports.app.sectionPageA;
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

        let segments = {

            'Lessons and Classes': [
                new CardA.CardA({
                    title: 'Subtitled Card',
                    synopsis: 'This is the Subtitle',
                }),
                new CardA.CardA({
                    title: 'Picture Card',
                    thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
                })
            ],

            'Articles and Files': [
                new CardA.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),
            ],

            'Devon and Higgins': [
                new CardA.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),
            ],

            'Fernando and Frango': [
                new CardA.CardA({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                }),
            ]
        }

        let section_page = new SectionPageA.SectionPageA({
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
