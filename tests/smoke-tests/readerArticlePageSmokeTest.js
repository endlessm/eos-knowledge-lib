// Copyright (C) 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticlePage = imports.app.reader.articlePage;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.reader.article-page';
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
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let page = new ArticlePage.ArticlePage();
        page.title_view.title = 'Psychology of Underwear: What Lies Beneath';
        page.title_view.attribution = 'By My Cocaine on May 31, 2015';
        page.get_style_context().add_class('article-page0');
        let webview = new WebKit2.WebView();
        webview.load_uri('file://' +  TESTDIR + '/test-content/ipsum.html');
        page.show_content_view(webview);

        let window = new Endless.Window({
            application: this
        });
        window.page_manager.add(page);
        window.show_all();
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
