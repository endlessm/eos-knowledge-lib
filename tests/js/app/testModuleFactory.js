// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Knowledge = imports.app.knowledge;
const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;
const ModuleFactory = imports.app.moduleFactory;

Gtk.init(null);

const MOCK_APP_JSON = {
    version: 2,
    modules: {
        'test': {
            type: 'TestModule',
            slots: {
                'test-slot': 'test-submodule',
                'anonymous-slot-1': {
                    type: 'TestModule',
                },
                'anonymous-slot-2': {
                    type: 'TestModule',
                },
            },
        },
        'test-submodule': {
            type: 'TestModule',
        },
        'card-module': {
            type: 'MinimalCard',
            properties: {
                'expand': 'true',
                'width-request': 200,
                'halign': 'end',
            }
        },
        'bad-prop-module': {
            type: 'MinimalCard',
            properties: {
                'asdf': 'true',
            }
        },
        'bad-enum-module': {
            type: 'MinimalCard',
            properties: {
                'halign': 'asdf',
            }
        },
        'test2': {
            type: 'TestModule',
            slots: {
                'test-slot': 'named-anonymous-1',
                'optional-slot': {
                    type: 'TestModule',
                    slots: {
                        'reference-slot-1': 'named-anonymous-1',
                    },
                },
                'anonymous-slot-1': {
                    type: 'TestModule',
                    name: 'named-anonymous-1',
                    slots: {
                        'anonymous-slot-2': {
                            type: 'TestModule',
                            slots: {
                                'reference-slot-1': 'named-anonymous-1',
                            },
                        },
                    },
                },
                'anonymous-slot-2': {
                    type: 'TestModule',
                    slots: {
                        'test-slot': 'named-anonymous-1',
                    },
                },
            },
        },
    },
};

const MockModule = new Module.Class({
    Name: 'MockModule',
    Extends: Minimal.MinimalModule,
    Slots: {
        'test-slot': {},
        'optional-slot': {},
        'anonymous-slot-1': {},
        'anonymous-slot-2': {},
        'reference-slot-1': {
            reference: true,
        }
    },

    _init: function (props={}) {
        this.parent(props);
        this.register_module();
    },
});

const MockWarehouse = new Knowledge.Class({
    Name: 'MockWarehouse',
    Extends: GObject.Object,
    // ModuleFactory has a 'warehouse' property with an object param spec, so
    // this class is required to extend GObject.Object even though it doesn't
    // use any GObject features.

    type_to_class: function (type) {
        if (type === 'MinimalCard')
            return Minimal.MinimalCard;
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

    it('allows omitting an optional slot in app.json, returning null', function () {
        let parent = module_factory.create_named_module('test');
        let submodule = module_factory.create_module_for_slot(parent,
            'optional-slot');
        expect(submodule).toBeNull();
    });

    it('also allows omitting slots object altogether in app.json, returning null', function () {
        let parent = module_factory.create_named_module('test-submodule');
        let submodule = module_factory.create_module_for_slot(parent,
            'optional-slot');
        expect(submodule).toBeNull();
    });

    it('gives a module its factory name if it has one', function () {
        let module = module_factory.create_named_module('test');
        expect(module.factory_name).toBe('test');
    });

    it('errors if creating a module slot not listed in Slots', function () {
        let parent = module_factory.create_named_module('test');
        expect(() => {
            module_factory.create_module_for_slot(parent, 'fake-slot');
        }).toThrow();
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

        it('modules can also be named', function () {
            let parent = module_factory.create_named_module('test2');
            let module1 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            let module2 = module_factory.create_named_module('named-anonymous-1');
            expect(module1).toEqual(module2);
        });
    });

    describe('referenced modules', function () {
        it('use the same instance when a slot is marked as a reference', function () {
            let parent = module_factory.create_named_module('test2');
            let module1 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            let module2 = module_factory.create_module_for_slot(module1, 'anonymous-slot-2');
            let module3 = module_factory.create_module_for_slot(module2, 'reference-slot-1');
            expect(module1).toBe(module3);
        });

        it('use a different instance when a slot is not marked as reference', function () {
            let parent = module_factory.create_named_module('test2');
            let module1 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            let module2 = module_factory.create_named_module('named-anonymous-1');
            expect(module1).not.toBe(module2);
        });

        it('order does not affect the outcome', function () {
            let parent = module_factory.create_named_module('test2');

            let module1 = module_factory.create_module_for_slot(parent, 'test-slot');

            let module2 = module_factory.create_module_for_slot(parent, 'optional-slot');
            let module3 = module_factory.create_module_for_slot(module2, 'reference-slot-1');

            let module4 = module_factory.create_module_for_slot(parent, 'anonymous-slot-1');
            let module5 = module_factory.create_module_for_slot(module4, 'anonymous-slot-2');
            let module6 = module_factory.create_module_for_slot(module5, 'reference-slot-1');

            let module7 = module_factory.create_module_for_slot(parent, 'anonymous-slot-2');
            let module8 = module_factory.create_module_for_slot(module7, 'test-slot');

            expect(module1).not.toBe(module3);
            expect(module3).toBe(module4);
            expect(module4).toBe(module6);
            expect(module6).not.toBe(module8);
            expect(module1).not.toBe(module8);
        });
    });

    describe('properties', function () {
        it('can be passed in on module creation', function () {
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

        it('are parsed from the app json', function () {
            let module = module_factory.create_named_module('card-module');
            expect(module.expand).toBe(true);
            expect(module.width_request).toBe(200);
        });

        it('function with enum names in app json', function () {
            let module = module_factory.create_named_module('card-module');
            expect(module.halign).toBe(Gtk.Align.END);
        });

        it('warn if not found on module class', function () {
            spyOn(window, 'logError');
            module_factory.create_named_module('bad-prop-module');
            expect(logError).toHaveBeenCalled();
        });

        it('warn if not enum value not found', function () {
            spyOn(window, 'logError');
            module_factory.create_named_module('bad-enum-module');
            expect(logError).toHaveBeenCalled();
        });
    });
});
