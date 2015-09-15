// Copyright 2015 Endless Mobile, Inc.

/* exported MinimalArrangement, MinimalBackCover, MinimalCard,
MinimalDocumentCard, MinimalHomePage, MinimalLightbox, MinimalModule,
test_arrangement_compliance */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const DocumentCard = imports.app.interfaces.documentCard;
const Module = imports.app.interfaces.module;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const Utils = imports.tests.utils;

const MinimalArrangement = new Lang.Class({
    Name: 'MinimalArrangement',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'transition-duration': GObject.ParamSpec.uint('transition-duration', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 1),
    },

    _init: function (props={}) {
        this.parent(props);
        this._cards = [];
        this.show_all();
    },

    get_cards: function () {
        return this._cards;
    },

    add_card: function (card) {
        this._cards.push(card);
    },

    clear: function () {
        this._cards= [];
    },

    set_transition_type: function (type) {
        this._type = type;
    },

    get_transition_type: function () {
        return this._type;
    },

    set_visible_child: function (child) {
        this._child = child;
    },

    get_visible_child: function () {
        return this._child;
    },
});

const MinimalCard = new Lang.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
    }
});

const MinimalHomePage = new Lang.Class({
    Name: 'MinimalHomePage',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        this.show_all();
    },
});

const MinimalBackCover = new Lang.Class({
    Name: 'MinimalBackCover',
    Extends: Gtk.Widget,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'progress-label': GObject.ParamSpec.object('progress-label', 'Progress label',
            '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gtk.Widget),
    },

    _init: function (props={}) {
        props.progress_label = props.progress_label || new Gtk.Label();
        this.parent(props);
    },
});

const MinimalModule = new Lang.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});

const MinimalDocumentCard = new Lang.Class({
    Name: 'MinimalDocumentCard',
    Extends: Gtk.Widget,
    Implements: [ Module.Module, Card.Card, DocumentCard.DocumentCard ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'content-view': GObject.ParamSpec.override('content-view', DocumentCard.DocumentCard),
        'info-notice': GObject.ParamSpec.object('info-notice', 'Info notice',
            '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gtk.Widget),
        'show-toc': GObject.ParamSpec.boolean('show-toc', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'show-top-title': GObject.ParamSpec.boolean('show-top-title', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
    },

    _init: function (props={}) {
        props.info_notice = props.info_notice || new Gtk.Label();
        this.parent(props);
        this.toc = {
            connect: function () {},
        };
        this.content_view = {
            connect: function () {},
        };
    },

    load_content: function (cancellable, callback) { callback(this); },
    load_content_finish: function () {},
    clear_content: function () {},
});

const MinimalLightbox = new Lang.Class({
    Name: 'MinimalLightbox',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});

function test_arrangement_compliance() {
    describe('implements Arrangement correctly', function () {
        let cards;

        beforeEach(function () {
            jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
            cards = [];
        });

        function add_cards(arrangement, ncards) {
            for (let ix = 0; ix < ncards; ix++) {
                cards.push(new MinimalCard({
                    model: new ContentObjectModel.ContentObjectModel(),
                }));
            }
            cards.forEach(arrangement.add_card, arrangement);
            Utils.update_gui();
        }

        it('by adding cards to the list', function () {
            add_cards(this.arrangement, 3);
            cards.forEach((card) =>
                expect(this.arrangement).toHaveDescendant(card));
            expect(this.arrangement.get_cards().length).toBe(3);
        });

        it('by removing cards from the list', function () {
            add_cards(this.arrangement, 3);
            this.arrangement.clear();
            Utils.update_gui();

            cards.forEach((card) =>
                expect(this.arrangement).not.toHaveDescendant(card));
            expect(this.arrangement.get_cards().length).toBe(0);
        });
    });
}
