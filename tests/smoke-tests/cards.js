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
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css')
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let card1 = new EosKnowledge.Card({
            title: 'Subtitled Card',
            subtitle: 'This is the Subtitle',
            expand: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER
        });
        card1.connect('clicked', function () {
            print('Card 1 clicked');
        });
        let card2 = new EosKnowledge.Card({
            title: 'Picture Card',
            thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            expand: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER
        });
        card2.connect('clicked', function () {
            print('Card 2 clicked');
        });
        let card3 = new EosKnowledge.Card({
            title: 'Everything card',
            subtitle: 'This card has everything',
            thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            expand: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER
        });
        card3.connect('clicked', function () {
            print('Card 3 clicked');
        });

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        grid.add(card1);
        grid.add(card2);
        grid.add(card3);

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
