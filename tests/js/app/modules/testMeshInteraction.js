// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const MeshInteraction = imports.app.modules.meshInteraction;
const Minimal = imports.tests.minimal;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;

Gtk.init(null);

const MockHomePage = new Lang.Class({
    Name: 'MockHomePage',
    Extends: GObject.Object,
    Signals: {
        'search-entered': {
            param_types: [GObject.TYPE_STRING],
        },
    },

    _init: function () {
        this.parent();
        this.app_banner = {};
        this._bottom = new MockWidgets.MockItemGroupModule();
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockHomePage.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },
});

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Signals: {
        'back-clicked': {},
        'forward-clicked': {},
        'search-entered': {
            param_types: [GObject.TYPE_STRING],
        },
    },

    _init: function () {
        this.parent();
        let connectable_object = {
            connect: function () {},
        };
        this.section_page = connectable_object;
        this.section_page.remove_all_cards = function () {};
        this.section_page.append_cards = function () {};
        this.home_page = new MockHomePage();
        this.home_page.tab_button = {};
        this.categories_page = connectable_object;
        this.categories_page.tab_button = {};
        this.article_page = connectable_object;
        this.search_page = connectable_object;
        this.no_search_results_page = {};
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    show_page: function (page) {},
    lock_ui: function () {},
    unlock_ui: function () {},
    present_with_time: function () {},
});

describe('Mesh interaction', function () {
    let mesh;

    beforeEach(function () {
        let application = new GObject.Object();
        application.application_id = 'foobar';
        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-card', Minimal.MinimalCard);
        factory.add_named_mock('document-card', Minimal.MinimalDocumentCard);
        let engine = new MockEngine.MockEngine();
        let view = new MockView();

        mesh = new MeshInteraction.MeshInteraction({
            application: application,
            factory: factory,
            engine: engine,
            view: view,
        });
    });

    it('can be constructed', function () {});
});
