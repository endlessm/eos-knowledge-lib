// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const HistoryStore = imports.app.historyStore;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Mesh = imports.app.modules.controller.mesh;
const MeshHistoryStore = imports.app.meshHistoryStore;
const Knowledge = imports.app.knowledge;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

const MockView = new Knowledge.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Signals: {
        'key-press-event': {
            param_types: [ GObject.TYPE_OBJECT ],
        },
    },

    _init: function (props) {
        void props;  // Silently ignore properties
        this.parent();
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    make_ready: function (cb=function () {}) {
        cb();
    },

    get_style_context: function () {
        return {
            add_class: function () {},
        };
    },
});

const MockEvent = new GObject.Class({
    Name: 'MockEvent',
    Extends: GObject.Object,
});

describe('Controller.Mesh', function () {
    let mesh, factory, dispatcher, view;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        let application = new GObject.Object();
        application.application_id = 'foobar';

        [mesh, factory] = MockFactory.setup_tree({
            type: Mesh.Mesh,
            properties: {
                'application': application,
                'template-type': 'B',
                'theme': '',
            },
            slots: {
                'window': { type: MockView },
            },
        });
        mesh.make_ready();
        view = factory.get_last_created('window');
    });

    it('creates a specific history store', function () {
        expect(HistoryStore.get_default())
            .toBeA(MeshHistoryStore.MeshHistoryStore);
    });

    it('creates a window module', function () {
        expect(view).toBeDefined();
    });

    describe('on state change to set page', function () {
        beforeEach(function () {
        });

        it('dispatches hide-article-search after escape key pressed', function () {
            dispatcher.reset();
            let event = new MockEvent();
            event.get_keyval = () => {
                return [null, Gdk.KEY_Escape];
            };
            event.get_state = () => {
                return [null, null];
            };
            view.emit('key-press-event', event)
            expect(dispatcher.last_payload_with_type(Actions.HIDE_ARTICLE_SEARCH))
                .toBeDefined();
        });

        it('dispatches show-article-search after Ctrl+F pressed', function () {
            dispatcher.reset();
            let event = new MockEvent();
            event.get_keyval = () => {
                return [null, Gdk.KEY_f];
            };
            event.get_state = () => {
                return [null, Gdk.ModifierType.CONTROL_MASK];
            };
            view.emit('key-press-event', event);
            expect(dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_SEARCH))
                .toBeDefined();
        });
    });
});
