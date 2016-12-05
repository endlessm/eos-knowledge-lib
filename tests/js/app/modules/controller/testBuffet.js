// Copyright 2015 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Buffet = imports.app.modules.controller.buffet;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const SetMap = imports.app.setMap;

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

        set_models = [0, 1, 2].map(() => Eknc.SetObjectModel.new_from_props({
            tags: ['foo'],
        }));
        let parent = Eknc.SetObjectModel.new_from_props({
            child_tags: ['foo'],
        });
        set_models.push(parent);

        engine = MockEngine.mock_default();
        engine.get_objects_by_query_finish.and.returnValue([set_models, {
            more_results: null,
        }]);

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

    it('initializes set map', function(done) {
        buffet.make_ready(function () {
            let child_set = set_models[0];
            expect(SetMap.get_parent_set(child_set)).toBeDefined();
            done();
        });
    });
});
