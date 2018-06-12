// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.framework.historyStore;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Mesh = imports.framework.modules.controller.mesh;
const MeshHistoryStore = imports.framework.meshHistoryStore;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const Module = imports.framework.interfaces.module;

Gtk.init(null);

const MockView = new Module.Class({
    Name: 'MockView',
    Extends: GObject.Object,

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
});

describe('Controller.Mesh', function () {
    let mesh, engine, factory;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        let application = new GObject.Object();
        application.application_id = 'foobar';

        engine = MockEngine.mock_default();
        engine.query_promise.and.returnValue(Promise.resolve({ models: [] }));

        [mesh, factory] = MockFactory.setup_tree({
            type: Mesh.Mesh,
            properties: {
                'application': application,
                'template-type': 'thematic',
                'theme': '',
            },
            slots: {
                'window': { type: MockView },
            },
        });
        mesh.make_ready();
    });

    it('creates a specific history store', function () {
        expect(HistoryStore.get_default())
            .toBeA(MeshHistoryStore.MeshHistoryStore);
    });

    it('creates a window module', function () {
        expect(factory.get_last_created('window')).toBeDefined();
    });
});
