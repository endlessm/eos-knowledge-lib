// Copyright 2015 Endless Mobile, Inc.

/* exported MinimalArrangement, MinimalBackCover, MinimalCard, MinimalDocumentCard,
MinimalPage, MinimalHomePage, MinimalInteraction, MinimalBinModule, MinimalModule,
test_arrangement_compliance */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const DocumentCard = imports.app.interfaces.documentCard;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const Module = imports.app.interfaces.module;
const Scrollable = imports.app.interfaces.scrollable;
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
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    vfunc_size_allocate: function (allocation) {
        this.parent(allocation);
        this.update_card_sizing_classes(allocation.height, allocation.width);
    },
});

const MinimalScrollable = new Lang.Class({
    Name: 'MinimalScrollable',
    Extends: GObject.Object,
    Implements: [ Module.Module, Scrollable.Scrollable ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'scroll-server': GObject.ParamSpec.override('scroll-server', Scrollable.Scrollable),
    },

    _init: function (props={}) {
        this.parent(props);
        this.scrollable_init();
    },

    show_more_content: function () {},
});

const MinimalInteraction = new Lang.Class({
    Name: 'MinimalInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
        'subtitle': GObject.ParamSpec.override('subtitle', Interaction.Interaction),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    desktop_launch: function () {},
});

const MinimalPage = new Lang.Class({
    Name: 'MinimalPage',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'subtitle': GObject.ParamSpec.string('subtitle', '', '', GObject.ParamFlags.READWRITE, ''),
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
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'content-view': GObject.ParamSpec.override('content-view', DocumentCard.DocumentCard),
        'custom-css': GObject.ParamSpec.override('custom-css',
            DocumentCard.DocumentCard),
        'info-notice': GObject.ParamSpec.object('info-notice', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            Gtk.Widget),
        'show-toc': GObject.ParamSpec.boolean('show-toc', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'show-top-title': GObject.ParamSpec.boolean('show-top-title', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'previous-card': GObject.ParamSpec.object('previous-card',
            'Previous Card', 'Previous Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        'next-card': GObject.ParamSpec.object('next-card',
            'Next Card', 'Next Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),

    },

    _init: function (props={}) {
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

const MinimalBinModule = new Lang.Class({
    Name: 'MinimalBinModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        this.infobar = new Gtk.Label(); // StandalonePage requires this
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
