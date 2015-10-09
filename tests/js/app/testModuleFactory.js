// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;

const Minimal = imports.tests.minimal;
const ModuleFactory = imports.app.moduleFactory;

const MOCK_APP_JSON = {
    version: 2,
    modules: {
        'test': {
            type: 'TestModule',
            slots: {
                'test_slot': 'test_submodule',
                'optional_slot': null,
            },
        },
        'test_submodule': {
            type: 'TestModule',
        },
    },
};

const MockModule = new Lang.Class({
    Name: 'MockModule',
    Extends: Minimal.MinimalModule,

    get_slot_names: function () {
        return ['test_slot', 'optional_slot'];
    },
});

const MockWarehouse = new Lang.Class({
    Name: 'MockWarehouse',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
    },

    type_to_class: function (module_name) {
        return MockModule;
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

    it('supports extra construct properties when creating modules for slots', function () {
        let parent = module_factory.create_named_module('test');

        let test_constructor = jasmine.createSpy('TestModuleConstructor');
        spyOn(warehouse, 'type_to_class').and.returnValue(test_constructor);
        module_factory.create_module_for_slot(parent, 'test_slot', {
            foo: 'bar',
        });
        expect(test_constructor).toHaveBeenCalledWith(jasmine.objectContaining({
            foo: 'bar',
        }));
    });

    it('allows null as a value to indicate a slot is not filled', function () {
        let parent = module_factory.create_named_module('test');
        let submodule = module_factory.create_module_for_slot(parent,
            'optional_slot');
        expect(submodule).toBeNull();
    });

    it('errors if creating a module slot not listed in get_slot_names', function () {
        let parent = module_factory.create_named_module('test');
        expect(() => {
            module_factory.create_module_for_slot(parent, 'fake_slot');
        }).toThrow();
    });
});
