const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const LegacyPolaroidCard = imports.app.modules.legacyPolaroidCard;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.card';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {
        this.parent();

        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/mesh.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let cards = [
            new LegacyPolaroidCard.LegacyPolaroidCard({
                title: 'Synopsis Card',
                synopsis: 'This is a really long synopsis. It is so long, that I have to sit here and think of things to write to show how long it is. And I still need more text. What else is there to write?',
            }),
            new LegacyPolaroidCard.LegacyPolaroidCard({
                title: 'Picture Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new LegacyPolaroidCard.LegacyPolaroidCard({
                title: 'Everything card',
                synopsis: 'This card has everything',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
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

        cards[8].connect('clicked', function (card) {
            card.completed_items = (card.completed_items + 1) % (card.total_items + 1);
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
