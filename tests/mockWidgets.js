// Copyright 2015 Endless Mobile, Inc.

/* exported MockButton, MockHistoryButtons, MockItemGroupModule,
MockScrolledLayout, MockSearchBox, MockSidebarTemplate, MockEknWebview */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Knowledge = imports.app.knowledge;
const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;

const MockButton = new Knowledge.Class({
    Name: 'MockButton',
    Extends: GObject.Object,
    Properties: {
        'sensitive': GObject.ParamSpec.boolean('sensitive', '', '',
            GObject.ParamFlags.READWRITE, true),
    },
    Signals: {
        'clicked': {},
    },
});

const MockScrolledLayout = new Module.Class({
    Name: 'MockScrolledLayout',
    Extends: Minimal.MinimalBinModule,
    Signals: {
        'need-more-content': {},  // needed for several arrangements
    },
    Slots: {
        'content': {},
    },
    _init: function (props={}) {
        this.parent(props);
        this.create_submodule('content');
    },
    new_content_added: function () {},
});

const MockSearchBox = new Module.Class({
    Name: 'MockSearchBox',
    Extends: Gtk.Label,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },

    set_menu_items: function () {},

    set_text_programmatically: function () {},
});

const MockItemGroupModule = new Module.Class({
    Name: 'MockItemGroupModule',
    Extends: Gtk.Widget,

    Signals: {
        'article-selected': {},
        'need-more-content': {},
    },

    add_card: function () {},
});

const MockSidebarTemplate = new Knowledge.Class({
    Name: 'MockSidebarTemplate',
    Extends: Gtk.Grid,
    _init: function (props={}) {
        Lang.copyProperties(props, this);
        this.parent({});
        this.content_frame = new Gtk.Grid();
        this.sidebar_frame = new Gtk.Grid();
        this.add(this.content_frame);
        this.add(this.sidebar_frame);
    },
    connect: function () {},
});

const MockRenderer = new Knowledge.Class({
    Name: 'MockRenderer',
    Extends: GObject.Object,
    Properties: {
        'show-title': GObject.ParamSpec.boolean('show-title',
           'Show Title', 'Show Title',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        'enable-scroll-manager': GObject.ParamSpec.boolean('enable-scroll-manager',
           'Enable Scroll Manager', 'Enable Scroll Manager',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },
    set_custom_css_files: function () {},
    set_custom_javascript_files: function () {},
    render: function () {
        return '<html><body></body></html>';
    },
});

const MockEknWebview = new Knowledge.Class({
    Name: 'MockEknWebview',
    Extends: Gtk.Frame,
    Signals: {
        'load-changed': {
            param_types: [ GObject.TYPE_UINT ],
        },
        'load-failed': {
            param_types: [ GObject.TYPE_UINT, GObject.TYPE_STRING ],
        },
        'decide-policy': {
            param_types: [ GObject.TYPE_OBJECT, GObject.TYPE_OBJECT ],
        },
    },
    _init: function (props={}) {
        this.parent(props);
        this.renderer = new MockRenderer();
    },
    load_uri: function () {},
    get_page_id: function () { return 1; },
});

const MockSizeWidget = new Module.Class({
    Name: 'MockSkizeWidget',
    Extends: Gtk.Widget,

    _init: function (props={}) {
        this.parent(props);
        this.set_has_window(false);
        // Spying directly on the vfuncs does not play well with gjs internals
        spyOn(this, 'mode_spy').and.callThrough();
        spyOn(this, 'width_spy').and.callThrough();
        spyOn(this, 'width_for_height_spy').and.callThrough();
        spyOn(this, 'height_spy').and.callThrough();
        spyOn(this, 'height_for_width_spy').and.callThrough();
    },

    vfunc_get_request_mode: function () {
        return this.mode_spy();
    },

    vfunc_get_preferred_width: function () {
        return this.width_spy();
    },

    vfunc_get_preferred_width_for_height: function (width) {
        return this.width_for_height_spy(width);
    },

    vfunc_get_preferred_height: function () {
        return this.height_spy();
    },

    vfunc_get_preferred_height_for_width: function (height) {
        return this.height_for_width_spy(height);
    },

    mode_spy: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    width_spy: function () {
        return [10, 10];
    },

    width_for_height_spy: function () {
        return [10, 10];
    },

    height_spy: function () {
        return [10, 10];
    },

    height_for_width_spy: function () {
        return [10, 10];
    },
});
