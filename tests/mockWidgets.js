// Copyright 2015 Endless Mobile, Inc.

/* exported MockEknWebview, MockHistoryButtons, MockRenderer,
MockScrolledLayout, MockSizeWidget */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Knowledge = imports.app.knowledge;
const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;

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
            param_types: [ GObject.TYPE_OBJECT, WebKit2.PolicyDecisionType.$gtype ],
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
