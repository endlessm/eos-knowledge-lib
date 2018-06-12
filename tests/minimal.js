// Copyright 2015 Endless Mobile, Inc.

/* exported add_cards, MinimalArrangement, MinimalBinModule, MinimalCard,
MinimalHomePage, MinimalModule, MinimalNavigationCard, MinimalOrder,
MinimalScrolling, MinimalView, MinimalXapianFilter, MinimalXapianOrder,
TitleFilter */

const {DModel, GLib, GObject, Gtk} = imports.gi;

const Arrangement = imports.framework.interfaces.arrangement;
const ArticleContent = imports.framework.interfaces.articleContent;
const Card = imports.framework.interfaces.card;
const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;
const NavigationCard = imports.framework.interfaces.navigationCard;
const Order = imports.framework.interfaces.order;
const Scrolling = imports.framework.interfaces.scrolling;
const Selection = imports.framework.modules.selection.selection;
const {View} = imports.framework.interfaces.view;

var MinimalArrangement = new Module.Class({
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

var MinimalCard = new Module.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Button,
    Implements: [View, Card.Card],

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

var MinimalNavigationCard = new Module.Class({
    Name: 'MinimalNavigationCard',
    Extends: Gtk.Button,
    Implements: [View, Card.Card, NavigationCard.NavigationCard],
});

var MinimalModule = new Module.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
});

var MinimalView = new Module.Class({
    Name: 'MinimalView',
    Extends: Gtk.Widget,
    Implements: [View, ArticleContent.ArticleContent],

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

var MinimalBinModule = new Module.Class({
    Name: 'MinimalBinModule',
    Extends: Gtk.Frame,
});

var MinimalSelection = new Module.Class({
    Name: 'MinimalSelection',
    Extends: Selection.Selection,

    queue_load_more: function (num_desired=5) {
        for (let i = 0; i < num_desired; i++) {
            let model = new DModel.Content();
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

var MinimalOrder = new Module.Class({
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

var MinimalXapianOrder = new Module.Class({
    Name: 'MinimalXapianOrder',
    Extends: MinimalOrder,
    Implements: [Order.Order],

    modify_xapian_query_impl: function (query) {
        return DModel.Query.new_from_object(query, {
            search_terms: `${query.search_terms} ${this.model_prop}`,
        });
    },
});

var TitleFilter = new Module.Class({
    Name: 'TitleFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    include_impl: function (model) {
        return model.title !== '0Filter me out';
    },
});

var MinimalXapianFilter = new Module.Class({
    Name: 'MinimalXapianFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    Properties: {
        'tag-to-include': GObject.ParamSpec.string('tag-to-include', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'EknIncludeMe'),
    },

    include_impl: function (model) {
        return model.tags.indexOf(this.tag_to_include) !== -1;
    },

    modify_xapian_query_impl: function (query) {
        return DModel.Query.new_from_object(query, {
            tags_match_all: (query.tags_match_all || []).concat(this.tag_to_include),
        });
    },
});

var MinimalScrolling = new Module.Class({
    Name: 'MinimalScrolling',
    Extends: Gtk.ScrolledWindow,
    Implements: [Scrolling.Scrolling],

    _init: function (props={}) {
        this.parent(props);
        this.add(this.create_submodule('content'));
    },
});

function add_cards(arrangement, ncards) {
    let models = [];
    for (let i = 0; i < ncards; i++)
        models.push(new DModel.Content());
    arrangement.set_models(arrangement.get_models().concat(models));
    return models;
}
