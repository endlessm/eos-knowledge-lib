// Copyright (C) 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardA = imports.app.modules.cardA;
const CardB = imports.app.modules.cardB;
const TextCard = imports.app.modules.textCard;
const Window = imports.app.window;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.window';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTDIR + '/test-content/test-content.gresource');
        resource._register();

        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);


        let template_type = 'A';
        for (let arg of ARGV) {
            if (arg === '-b') {
                template_type = 'B';
            }
        }
        let view = new Window.Window({
            application: this,
            background_image_uri: 'resource:///com/endlessm/thrones/background.jpg',
            blur_background_image_uri: 'resource:///com/endlessm/thrones/background_blurred.jpg',
            template_type: template_type,
        });
        view.home_page.connect('show-categories', function () {
            view.show_categories_page();
        });

        view.categories_page.connect('show-home', function () {
            view.show_home_page();
        });

        view.connect('back-clicked', function () {
            if (view.get_visible_page() === view.article_page) {
                view.show_section_page();
            } else {
                view.show_home_page();
            }
        });
        view.connect('forward-clicked', function () {
            view.show_article_page();
        });
        view.connect('sidebar-back-clicked', function () {
            if (view.get_visible_page() === view.article_page) {
                view.show_section_page();
            } else {
                view.show_home_page();
            }
        });

        // ============ HOME PAGE ==================
        view.home_page.title_image_uri = 'resource:///com/endlessm/thrones/agot.svg';
        let card_class = template_type === 'B' ? CardB.CardB : CardA.CardA;
        view.home_page.cards = [
            new card_class({
                title: 'A card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new card_class({
                title: 'B card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new card_class({
                title: 'C card',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new card_class({
                title: 'Mustard',
                thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
            })
        ];
        for (let card of view.home_page.cards) {
            card.connect('clicked', function () {
                view.show_section_page();
            });
        }

        // ============ SECTION PAGE ==================
        view.section_page.title = 'History of Guatemala';
        if (template_type === 'B') {
            view.section_page.cards = [
                new TextCard.TextCard({title: 'The Mayan Culture'}),
                new TextCard.TextCard({title: 'Colapse of the Mayans'}),
                new TextCard.TextCard({title: 'Arrival of the Spaniards'}),
                new TextCard.TextCard({title: 'The Colonial Era'}),
                new TextCard.TextCard({title: 'Independence'}),
                new TextCard.TextCard({title: 'The Republic'}),
                new TextCard.TextCard({title: 'Military Dictatorships'}),
                new TextCard.TextCard({title: 'Civil War'}),
                new TextCard.TextCard({title: 'The Democratic Transition'}),
                new TextCard.TextCard({title: 'The Mayan Culture'}),
                new TextCard.TextCard({title: 'Colapse of the Mayans'}),
                new TextCard.TextCard({title: 'Arrival of the Spaniards'}),
                new TextCard.TextCard({title: 'The Colonial Era'}),
                new TextCard.TextCard({title: 'Independence'}),
                new TextCard.TextCard({title: 'The Republic'}),
                new TextCard.TextCard({title: 'Military Dictatorships'}),
                new TextCard.TextCard({title: 'Civil War'}),
                new TextCard.TextCard({title: 'The Democratic Transition'}),
                new TextCard.TextCard({title: 'The Mayan Culture'}),
                new TextCard.TextCard({title: 'Colapse of the Mayans'}),
                new TextCard.TextCard({title: 'Arrival of the Spaniards'}),
                new TextCard.TextCard({title: 'The Colonial Era'}),
                new TextCard.TextCard({title: 'Independence'}),
                new TextCard.TextCard({title: 'The Republic'}),
                new TextCard.TextCard({title: 'Military Dictatorships'}),
                new TextCard.TextCard({title: 'Civil War'}),
                new TextCard.TextCard({title: 'The Democratic Transition'})
            ];
            for (let card of view.section_page.cards) {
                card.connect('clicked', function () {
                    view.show_article_page();
                });
            }
        } else {
            view.section_page.segments = {
                'Lessons and Classes': [
                    new CardA.CardA({
                        title: 'Subtitled Card',
                    }),
                    new CardA.CardA({
                        title: 'Picture Card',
                        thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
                    })
                ],
                'Articles and Files': [
                    new CardA.CardA({
                        title: 'Everything card',
                        thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                    }),
                ],
                'Devon and Higgins': [
                    new CardA.CardA({
                        title: 'Everything card',
                        thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                    }),
                ],
                'Fernando and Frango': [
                    new CardA.CardA({
                        title: 'Everything card',
                        thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
                    }),
                ]
            };
            for (let segment in view.section_page.segments) {
                for (let card of view.section_page.segments[segment]) {
                    card.connect('clicked', function () {
                        view.show_article_page();
                    });
                }
            }
        }

        // ============ ARTICLE PAGE ==================
        view.article_page.title = 'Big Old Title Thinger That Should Wrap';
        view.article_page.toc.section_list = [
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
            'Yolo bolo folo molo tolo holo golo brumhilda',
            'Why why why why why',
            'An article title',
            'A slightly longer article title',
            'What is this',
            'Blah ble blue blah blah fart blah blah blar',
            'The quick brown fox jumped over the small brown goat',
            'Yolo bolo folo molo tolo holo golo brumhilda'];
        view.article_page.toc.connect('section-clicked', function (widget, index) {
            view.article_page.toc.selected_section = index;
        });
        view.article_page.toc.connect('up-clicked', function () {
            view.article_page.toc.selected_section -= 1;
        });
        view.article_page.toc.connect('down-clicked', function () {
            view.article_page.toc.selected_section += 1;
        });
        view.article_page.switcher.load_uri('https://en.wikipedia.org');

        // ============ LIGHTBOX ==================
        view.lightbox.lightbox_widget = new Gtk.Image({
            file: TESTDIR + '/test-content/onion.jpg',
            visible: true
        });
        view.connect('key-press-event', function () {
            view.lightbox.reveal_overlays = !view.lightbox.reveal_overlays;
        });

        view.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
