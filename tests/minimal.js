// Copyright 2015 Endless Mobile, Inc.

/* exported add_filtered_cards, add_ordered_cards, MinimalOrder,
MinimalArrangement, MinimalBackCover, MinimalBinModule, MinimalCard,
MinimalDocumentCard, MinimalHomePage, MinimalInteraction, MinimalModule,
MinimalScrollable, MinimalPage, TitleFilter */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const DocumentCard = imports.app.interfaces.documentCard;
const Filter = imports.app.interfaces.filter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;
const Scrollable = imports.app.interfaces.scrollable;

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
        'all-visible': GObject.ParamSpec.override('all-visible',
            Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards',
            Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this.parent(props);
        this.show_all();
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
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
        // For test_card_container_compliance() below
        spyOn(this, 'fade_in').and.callThrough();
    },

    load_content: function () {},

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
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
            Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
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
        'archived': GObject.ParamSpec.boolean('archived', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this.parent(props);
        this.toc = {
            connect: function () {},
        };
        this.content_view = {
            grab_focus: function () {},
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
});

const MinimalOrder = new Lang.Class({
    Name: 'MinimalOrder',
    Extends: GObject.Object,
    Implements: [ Module.Module, Order.Order ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'ascending': GObject.ParamSpec.override('ascending', Order.Order),
        'model-prop': GObject.ParamSpec.string('model-prop', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'title'),
    },

    compare_impl: function (left, right) {
        return left[this.model_prop].localeCompare(right[this.model_prop]);
    },
});

const TitleFilter = new Lang.Class({
    Name: 'TitleFilter',
    Extends: GObject.Object,
    Implements: [ Module.Module, Filter.Filter ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'invert': GObject.ParamSpec.override('invert', Filter.Filter),
    },

    include_impl: function (model) {
        return model.title !== '0Filter me out';
    },
});

function add_ordered_cards(arrangement, ncards) {
    let models = [];
    for (let i = 0; i < ncards; i++) {
        let model = new ContentObjectModel.ContentObjectModel({
            title: i.toString(),
        });
        models.push(model);
        arrangement.add_model(model);
    }
    return models;
}

function add_filtered_cards(arrangement, n_yes, n_no) {
    let models = [];
    for (let i = 0; i < n_yes; i++) {
        let model = new ContentObjectModel.ContentObjectModel({
            title: '0Filter me out',
        });
        models.push(model);
        arrangement.add_model(model);
    }
    for (let i = 0; i < n_no; i++) {
        let model = new ContentObjectModel.ContentObjectModel({
            title: '#nofilter',
        });
        models.push(model);
        arrangement.add_model(model);
    }
    return models;
}
