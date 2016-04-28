// Copyright (C) 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TableOfContents = imports.app.widgets.tableOfContents;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.toc';
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


        let toc = new TableOfContents.TableOfContents({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER
        });
        toc.section_list = ['An article title',
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
        toc.connect('section-clicked', function (widget, index) {
            toc.target_section = index;
        });
        toc.connect('up-clicked', function () {
            toc.target_section -= 1;
        });
        toc.connect('down-clicked', function () {
            toc.target_section += 1;
        });

        let button = new Gtk.Button({
            label: 'Toggle collapsed',
            expand: true
        });
        button.connect('clicked', function () {
            toc.collapsed = !toc.collapsed;
        });

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        grid.add(toc);
        grid.add(button);

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(grid, {
            background_uri: 'file://' + TESTDIR + '/test-content/background.jpg'
        });
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
