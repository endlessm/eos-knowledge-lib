// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;

const ModuleFactory = imports.app.moduleFactory;
const Module = imports.app.interfaces.module;

const MOCK_APP_JSON = {
    version: 2,
    modules: {
        'test': {
            type: 'TestModule'
        },
    },
};

const TestModule = new Lang.Class({
    Name: 'TestModule',
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

const MockWarehouse = new Lang.Class({
    Name: 'MockWarehouse',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
    },

    type_to_class: function (module_name) {
        return TestModule;
    },
});

describe('Module factory', function () {
    let module_factory;
    let warehouse;

    beforeEach(function () {
        warehouse = new MockWarehouse();
        module_factory = new ModuleFactory.ModuleFactory({
            app_json: MOCK_APP_JSON,
            warehouse: warehouse,
        });
    });

    it ('constructs', function () {});

    it ('returns correct module constructor', function () {
        spyOn(warehouse, 'type_to_class').and.callThrough();
        module_factory.create_named_module('test');

        expect(warehouse.type_to_class).toHaveBeenCalledWith('TestModule');
    });
});
