const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Lang = imports.lang;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.card';
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
                title: 'Ketchup lesson',
                subtitle: 'No index',
                // By Rachel Tayse, CC-BY
                // http://en.wikipedia.org/wiki/File:Homemade_ketchup_canned_(4156502791).jpg
                thumbnail_uri: TESTDIR + '/test-content/ketchup.jpg',
                item_index: 0
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
                title: 'Relish lesson',
                subtitle: 'Sample, completed',
                // Public domain image
                thumbnail_uri: TESTDIR + '/test-content/relish.jpg',
                item_index: 2,
                complete: true
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
        ];
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL
        });

        cards.forEach(function (card, index) {
            card.expand = true;
            card.valign = Gtk.Align.CENTER;
            card.halign = Gtk.Align.CENTER;
            card.connect('clicked', function () {
                print('Card', index + 1, 'clicked');
            });
            grid.attach(card, index % 4, Math.floor(index / 4), 1, 1);
        });

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(grid);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
