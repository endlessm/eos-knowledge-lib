// Copyright (C) 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardA = imports.app.modules.cardA;
const Lightbox = imports.app.widgets.lightbox;
const MediaCard = imports.app.modules.mediaCard;
const Previewer = imports.app.widgets.previewer;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.lightbox';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        this._files = {
            image: Gio.File.new_for_path(TESTDIR + '/test-content/pig1.jpg'),
            copyrighted: Gio.File.new_for_path(TESTDIR + '/test-content/ketchup.jpg'),
            tallimage: Gio.File.new_for_path(TESTDIR + '/test-content/tall.jpg'),
            wideimage: Gio.File.new_for_path(TESTDIR + '/test-content/wide.jpg'),
        };

        this._infoboxes = {
            image: new MediaCard.MediaCard({
                caption: 'Ruínas maias em Tikal, abandonadas por razões desconhecidas no século X.',
                media_title: 'pig1.jpg',
                license_text: 'Some license',
                creator_text: 'Some creator'
            }),
            copyrighted: new MediaCard.MediaCard({
                caption: 'Ruínas maias em Tikal. Em Tikal, nas terras baixas do norte da Guatemala, muitas ruínas maias do III e IV séculos foram escavadas. ' +
                         'e estudadas. Acredita-se que a área, um dos maiores centros religiosos maia, teve uma população de 50.000 habitantes durante seu ' +
                         'apogeu, até que foi abandonada por razões desconhecidas no século X.\n' +
                         'Ruínas maias em Tikal. Em Tikal, nas terras baixas do norte da Guatemala, muitas ruínas maias do III e IV séculos foram escavadas. ' +
                         'e estudadas. Acredita-se que a área, um dos maiores centros religiosos maia, teve uma população de 50.000 habitantes durante seu ' +
                         'apogeu, até que foi abandonada por razões desconhecidas no século X.',
                media_title: 'ketchup.jpg',
                license_text: 'NSA Creative Commons Spy Alike',
                creator_text: 'Yo momma'
            }),
            tallimage: new MediaCard.MediaCard({
                caption: 'This image be super tall.',
                media_title: 'tall.jpg',
                license_text: 'blar',
                creator_text: 'O'
            }),
            wideimage: null
        };

        let image_card = new CardA.CardA({
            title: 'Open image in lightbox'
        });
        image_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.image;
            this._lightbox.reveal_overlays = true;
            this._lightbox.infobox_widget = this._infoboxes.image;
        }.bind(this)));

        let copyrighted_card = new CardA.CardA({
            title: 'Open secret sauce in lightbox'
        });
        copyrighted_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.copyrighted;
            this._lightbox.reveal_overlays = true;
            this._lightbox.infobox_widget = this._infoboxes.copyrighted;
        }.bind(this)));

        let tallimage_card = new CardA.CardA({
            title: 'Open tall image in lightbox'
        });
        tallimage_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.tallimage;
            this._lightbox.reveal_overlays = true;
            this._lightbox.infobox_widget = this._infoboxes.tallimage;
        }.bind(this)));

        let wideimage_card = new CardA.CardA({
            title: 'Open wide image in lightbox'
        });
        wideimage_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.wideimage;
            this._lightbox.reveal_overlays = true;
            this._lightbox.infobox_widget = this._infoboxes.wideimage;
        }.bind(this)));

        let grid = new Gtk.Grid();
        grid.add(image_card);
        grid.add(copyrighted_card);
        grid.add(tallimage_card);
        grid.add(wideimage_card);

        this._previewer = new Previewer.Previewer({
            visible: true
        });

        this._lightbox = new Lightbox.Lightbox({
            content_widget: this._previewer,
        });
        this._lightbox.add(grid);
        this._lightbox.connect('notify::overlays-revealed', function () {
            let animating = this._lightbox.overlays_revealed !== this._lightbox.reveal_overlays;
            this._previewer.animating = animating;
            if (!this._lightbox.overlays_revealed)
                this._previewer.file = null;
        }.bind(this));
        this._lightbox.connect('notify::reveal-overlays', function () {
            let animating = this._lightbox.overlays_revealed !== this._lightbox.reveal_overlays;
            this._previewer.animating = animating;
        }.bind(this));

        this._selected_file_index = 0;
        this._lightbox.connect('navigation-previous-clicked', Lang.bind(this, function () {
            this._selected_file_index--;
            if (this._selected_file_index === -1)
                this._selected_file_index = Object.keys(this._files).length - 1;
            let key = Object.keys(this._files)[this._selected_file_index];
            this._previewer.file = this._files[key];
            this._lightbox.infobox_widget = this._infoboxes[key];
        }));
        this._lightbox.connect('navigation-next-clicked', Lang.bind(this, function () {
            this._selected_file_index++;
            if (this._selected_file_index === Object.keys(this._files).length)
                this._selected_file_index = 0;
            let key = Object.keys(this._files)[this._selected_file_index];
            this._previewer.file = this._files[key];
            this._lightbox.infobox_widget = this._infoboxes[key];
        }));

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(this._lightbox);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
