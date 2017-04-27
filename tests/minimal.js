// Copyright 2015 Endless Mobile, Inc.

/* exported add_cards, MinimalArrangement, MinimalBinModule, MinimalCard,
MinimalDocumentCard, MinimalHomePage, MinimalModule, MinimalNavigationCard,
MinimalOrder, TitleFilter */

const Eknc = imports.gi.EosKnowledgeContent;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const ArticleContent = imports.app.interfaces.articleContent;
const Card = imports.app.interfaces.card;
const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const NavigationCard = imports.app.interfaces.navigationCard;
const Order = imports.app.interfaces.order;
const Selection = imports.app.modules.selection.selection;

const MinimalArrangement = new Module.Class({
    Name: 'MinimalArrangement',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    Properties: {
        'transition-duration': GObject.ParamSpec.uint('transition-duration', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 1),
        'max-cards': GObject.ParamSpec.int('max-cards', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            -1, GLib.MAXINT32, -1),
    },

    _init: function (props={}) {
        this.parent(props);
        this.show_all();
    },

    get_max_cards: function () {
        return this.max_cards;
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

const MinimalCard = new Module.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    _init: function (props={}) {
        this.parent(props);
        // For test_card_container_compliance() below
        spyOn(this, 'fade_in').and.callThrough();
        spyOn(this, 'load_content').and.callThrough();
    },

    load_content: function () {},

    vfunc_size_allocate: function (allocation) {
        this.parent(allocation);
        this.update_card_sizing_classes(allocation.height, allocation.width);
    },
});

const MinimalNavigationCard = new Module.Class({
    Name: 'MinimalNavigationCard',
    Extends: Gtk.Button,
    Implements: [Card.Card, NavigationCard.NavigationCard],
});

const MinimalModule = new Module.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
});

const MinimalModuleWithSlots = new Module.Class({
    Name: 'MinimalModuleWithSlots',
    Extends: GObject.Object,
    Slots: {
        submodule1: {},
        submodule2: {},
    },
});

const MinimalDocumentCard = new Module.Class({
    Name: 'MinimalDocumentCard',
    Extends: Gtk.Widget,
    Implements: [Card.Card, ArticleContent.ArticleContent],

    Properties: {
        'info-notice': GObject.ParamSpec.object('info-notice', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            Gtk.Widget),
        'show-toc': GObject.ParamSpec.boolean('show-toc', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'show-titles': GObject.ParamSpec.boolean('show-titles', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'previous-card': GObject.ParamSpec.object('previous-card',
            'Previous Card', 'Previous Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        'next-card': GObject.ParamSpec.object('next-card',
            'Next Card', 'Next Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
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

    load_content_promise: function () { return Promise.resolve(); },
    set_active: function () {},
});

const MinimalBinModule = new Module.Class({
    Name: 'MinimalBinModule',
    Extends: Gtk.Frame,
});

const MinimalSelection = new Module.Class({
    Name: 'MinimalSelection',
    Extends: Selection.Selection,

    queue_load_more: function (num_desired=5) {
        for (let i = 0; i < num_desired; i++) {
            let model = Eknc.ContentObjectModel.new_from_props();
            this.add_model(model);
        }
        this.emit('models-changed');
    },

    simulate_error: function () {
        this.in_error_state = true;
        this.notify('in-error-state');
    },

    get_error: function () {
        return new Error('this string should show up in the backtrace');
    },
});

const MinimalOrder = new Module.Class({
    Name: 'MinimalOrder',
    Extends: GObject.Object,
    Implements: [Order.Order],

    Properties: {
        'model-prop': GObject.ParamSpec.string('model-prop', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'title'),
    },

    compare_impl: function (left, right) {
        return left[this.model_prop].localeCompare(right[this.model_prop]);
    },
});

const TitleFilter = new Module.Class({
    Name: 'TitleFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    include_impl: function (model) {
        return model.title !== '0Filter me out';
    },
});

function add_cards(arrangement, ncards) {
    let models = [];
    for (let i = 0; i < ncards; i++)
        models.push(Eknc.ContentObjectModel.new_from_props());
    arrangement.set_models(arrangement.get_models().concat(models));
    return models;
}
