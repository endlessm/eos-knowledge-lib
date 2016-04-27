// Copyright (C) 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticlePage = imports.app.reader.articlePage;
const Window = imports.app.reader.window;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.reader-window';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let window = new Window.Window({
            application: this,
        });

        for (let i = 0; i < 15; i++) {
            let a = new ArticlePage.ArticlePage({ title : 'Example page #' + (i + 1) });
            window.append_article_page(a);
        }

        window.show_all();
        window.nav_buttons.connect('back-clicked', function() {
            // Decrement current page if it is less than 0.
            window.current_page = window.current_page > 0 ? window.current_page - 1 : 0;
        });

        window.nav_buttons.connect('forward-clicked', function() {
            window.current_page = window.current_page < window.total_pages - 1 ? window.current_page + 1 : window.current_page;
        });
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
