// Copyright 2015 Endless Mobile, Inc.

/* exported MockButton, MockHistoryButtons, MockItemGroupModule,
MockScrolledArrangement, MockSearchBox, MockSidebarTemplate, MockEknWebview,
TestBox */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;

const MockButton = new Lang.Class({
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

const MockScrolledArrangement = new Lang.Class({
    Name: 'MockScrolledArrangement',
    Extends: Minimal.MinimalArrangement,
    Properties: {
        'bottom-buffer': GObject.ParamSpec.int('bottom-buffer', '', '',
            GObject.ParamFlags.READWRITE, -1, 9999, -1),
    },
    Signals: {
        'need-more-content': {},  // needed for several arrangements
    },
});

const MockSearchBox = new Lang.Class({
    Name: 'MockSearchBox',
    Extends: Gtk.Label,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },

    _init: function (props={}) {
        this.parent(props);
    },

    set_menu_items: function () {},

    set_text_programmatically: function () {},
});

const MockItemGroupModule = new Lang.Class({
    Name: 'MockItemGroupModule',
    Extends: Gtk.Widget,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },
    Signals: {
        'article-selected': {},
        'need-more-content': {},
    },

    add_card: function () {},
});

const MockSidebarTemplate = new Lang.Class({
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

const MockRenderer = new Lang.Class({
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
    _init: function (props={}) {
        this.parent(props);
    },
    set_custom_css_files: function () {},
    set_custom_javascript_files: function () {},
    render: function () {
        return '<html><body></body></html>';
    },
});

const MockEknWebview = new Lang.Class({
    Name: 'MockEknWebview',
    Extends: Gtk.Widget,
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
});

// Test box with a natural request of a particular size.
const TestBox = new Lang.Class({
    Name: 'TestBox',
    Extends: Gtk.Frame,

    _init: function (size, props={}) {
        props['valign'] = Gtk.Align.START;
        props['halign'] = Gtk.Align.START;
        props['hexpand'] = true;
        props['vexpand'] = true;
        this.parent(props);
        this.size = size;
    },

    vfunc_get_preferred_width: function () {
        return [1, this.size];
    },

    vfunc_get_preferred_height: function () {
        return [1, this.size];
    },
});
