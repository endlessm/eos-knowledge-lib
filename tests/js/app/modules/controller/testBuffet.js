// Copyright 2015 Endless Mobile, Inc.

const {DModel, GObject, Gtk} = imports.gi;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Buffet = imports.app.modules.controller.buffet;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;

const MockView = new Module.Class({
    Name: 'testBuffetController_MockView',
    Extends: Gtk.Window,
    Implements: [ Module.Module ],

    Properties: {
        'template-type': GObject.ParamSpec.string('template-type', '', '',
            GObject.ParamFlags.READWRITE, ''),
    },
});

describe('Controller.Buffet', function () {
    let buffet, engine, factory, set_models, store;

    beforeEach(function () {

        set_models = [0, 1, 2].map(() => new DModel.Set({
            tags: ['foo'],
        }));
        let parent = new DModel.Set({
            child_tags: ['foo'],
        });
        set_models.push(parent);

        engine = MockEngine.mock_default();
        engine.query_promise.and.returnValue(Promise.resolve({ models: set_models }));

        [buffet, factory] = MockFactory.setup_tree({
            type: Buffet.Buffet,
            properties: {
                'theme': '',
            },
            slots: {
                'window': { type: MockView },
            },
        });
        store = HistoryStore.get_default();
    });
});
