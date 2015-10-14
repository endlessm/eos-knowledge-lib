// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const ModuleFactory = imports.app.moduleFactory;

const MOCK_APP_JSON = {
    version: 2,
    modules: {
        'test': {
            type: 'TestModule',
            slots: {
                'test-slot': 'test-submodule',
                'optional-slot': null,
                'anonymous-slot-1': {
                    type: 'TestModule',
                },
                'anonymous-slot-2': {
                    type: 'TestModule',
                },
                'dot.slot': null,
            },
        },
        'test-submodule': {
            type: 'TestModule',
        },
    },
};

const MockModule = new Lang.Class({
    Name: 'MockModule',
    Extends: Minimal.MinimalModule,

    get_slot_names: function () {
        return ['test-slot', 'optional-slot', 'anonymous-slot-1',
            'anonymous-slot-2', 'dot.slot'];
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
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
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
        module_factory.create_module_for_slot(parent, 'test-slot', {
            foo: 'bar',
        });
        expect(test_constructor).toHaveBeenCalledWith(jasmine.objectContaining({
            foo: 'bar',
        }));
    });

    it('allows null as a value to indicate a slot is not filled', function () {
        let parent = module_factory.create_named_module('test');
        let submodule = module_factory.create_module_for_slot(parent,
            'optional-slot');
        expect(submodule).toBeNull();
    });

    it('gives a module its factory name if it has one', function () {
        let module = module_factory.create_named_module('test');
        expect(module.factory_name).toBe('test');
    });

    it('errors if creating a module slot not listed in get_slot_names', function () {
        let parent = module_factory.create_named_module('test');
        spyOn(window, 'logError');
        module_factory.create_module_for_slot(parent, 'fake-slot');
        expect(logError).toHaveBeenCalled();
    });

    it('warns if creating a malformed slot name', function () {
        let parent = module_factory.create_named_module('test');
        spyOn(window, 'logError');
        module_factory.create_module_for_slot(parent, 'dot.slot');
        expect(logError).toHaveBeenCalled();
    });

    describe('anonymous modules', function () {
        it('are created when slot value is a module definition', function () {
            let parent = module_factory.create_named_module('test');
            let module = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            expect(module).toBeA(MockModule);
        });

        it('have correctly formed names', function () {
            let parent = module_factory.create_named_module('test');
            let module = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            expect(module.factory_name).toBe('test.anonymous-slot-1');
        });

        it('modules from the same definition have the same factory name', function () {
            let parent = module_factory.create_named_module('test');
            let module1 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            let module2 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            expect(module1.factory_name).toEqual(module2.factory_name);
        });
    });
});
