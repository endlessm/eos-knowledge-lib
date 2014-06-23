const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

EosKnowledge.init();

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.lightbox';
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
        this._files= {
            image: Gio.File.new_for_path(TESTDIR + '/test-content/pig1.jpg'),
            video: Gio.File.new_for_path(TESTDIR + '/test-content/sample.mp4')
        };

        let image_card = new EosKnowledge.CardA({
            title: 'Open image in lightbox'
        });
        image_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.image;
            this._lightbox.reveal_overlays = true;
        }.bind(this)));

        let video_card = new EosKnowledge.CardA({
            title: 'Open video in lightbox'
        });
        video_card.connect('clicked', Lang.bind(this, function () {
            this._previewer.file = this._files.video;
            this._lightbox.reveal_overlays = true;
        }.bind(this)));

        let grid = new Gtk.Grid();
        grid.add(image_card);
        grid.add(video_card);

        let label = new Gtk.Label({
            label: "Don't eat my hat man.\nI'll mess you up",
            visible: true
        });
        label.show();

        this._previewer = new EosKnowledge.Previewer({
            visible: true
        });

        this._lightbox = new EosKnowledge.Lightbox({
            // has_navigation_buttons: false,
            // has_close_button: false,
            content_widget: this._previewer,
            infobox_widget: label
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

        this._lightbox.connect('navigation-previous-clicked', Lang.bind(this, function () {
            if (this._previewer.file === this._files.image) {
                this._previewer.file = this._files.video;
            } else {
                this._previewer.file = this._files.image;
            }
        }));
        this._lightbox.connect('navigation-next-clicked', Lang.bind(this, function () {
            if (this._previewer.file === this._files.image) {
                this._previewer.file = this._files.video;
            } else {
                this._previewer.file = this._files.image;
            }
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
