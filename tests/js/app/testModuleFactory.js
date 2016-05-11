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
    root: {
        type: 'TestModule',
        slots: {
            'slot-1': {
                type: 'TestModule',
            },
            'slot-2': {
                type: 'TestModule',
                slots: {
                    'slot-1': {
                        type: 'TestModule',
                        id: 'referenced-module-1',
                        slots: {
                            'slot-1': {
                                type: 'TestModule',
                                references: {
                                    'reference-1': 'referenced-module-1',
                                },
                            },
                            'optional-slot': {
                                type: 'TestModule',
                                id: 'referenced-module-2'
                            },
                        },
                    },
                    'slot-2': {
                        type: 'TestModule',
                        slots: {
                            // Example of correct properties
                            'slot-1': {
                                type: 'MinimalCard',
                                properties: {
                                    'expand': 'true',
                                    'width-request': 200,
                                    'halign': 'end',
                                }
                            },
                            'slot-2': {
                                type: 'TestModule',
                                slots: {
                                    // Example of bad properties
                                    'slot-1': {
                                        type: 'MinimalCard',
                                        properties: {
                                            'asdf': 'true',
                                        }
                                    },
                                    // Example of bad enum value
                                    'slot-2': {
                                        type: 'MinimalCard',
                                        properties: {
                                            'halign': 'asdf',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                references: {
                    'reference-1': 'referenced-module-1',
                    'reference-2': 'referenced-module-2',
                },
            },
        },
    },
};

const NOT_UNIQUE_APP_JSON = {
    version: 2,
    root: {
        type: 'TestModule',
        slots: {
            'slot-1': {
                type: 'TestModule',
                id: 'referenced-module-1'
            },
            'slot-2': {
                type: 'TestModule',
                id: 'referenced-module-1'
            },
        },
    },
};

const IN_MULTI_APP_JSON = {
    version: 2,
    root: {
        type: 'TestModule',
        slots: {
            'slot-1': {
                type: 'TestModule',
                references: {
                    'reference-1': 'referenced-module-1',
                },
            },
            'multi-slot-1': {
                type: 'TestModule',
                slots: {
                    'slot-1': {
                        type: 'TestModule',
                        id: 'referenced-module-1',
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
        'slot-1': {},
        'slot-2': {},
        'optional-slot': {},
        'multi-slot-1': {
            multi: true,
        }
    },

    References: {
        'reference-1': {},
        'reference-2': {},
        'optional-reference-1': {},
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
    let module_factory, warehouse, root;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        warehouse = new MockWarehouse();
        module_factory = new ModuleFactory.ModuleFactory({
            app_json: MOCK_APP_JSON,
            warehouse: warehouse,
        });
        spyOn(warehouse, 'type_to_class').and.callThrough();
        root = module_factory.create_module_tree();
    });

    it ('returns correct module constructor', function () {
        expect(warehouse.type_to_class).toHaveBeenCalledWith('TestModule');
    });

    it('allows omitting an optional slot in app.json, returning null', function () {
        let submodule = module_factory.create_module_for_slot(root,
            'optional-slot');
        expect(submodule).toBeNull();
    });

    it('also allows omitting slots object altogether in app.json, returning null', function () {
        let parent = module_factory.create_module_for_slot(root,
            'slot-1');
        let submodule = module_factory.create_module_for_slot(parent,
            'optional-slot');
        expect(submodule).toBeNull();
    });

    it('errors if creating a module slot not listed in Slots', function () {
        expect(() => {
            module_factory.create_module_for_slot(root, 'fake-slot');
        }).toThrow();
    });

    it('creates a module for a module definition in a slot', function () {
        let module = module_factory.create_module_for_slot(root, 'slot-1');
        expect(module).toBeA(MockModule);
    });

    it('creates a module with a module tree path', function () {
        let module = module_factory.create_module_for_slot(root, 'slot-1');
        expect(module.factory_name).toBe('root.slot-1');
    });

    it('modules from the same definition have the same path', function () {
        let module1 = module_factory.create_module_for_slot(root, 'slot-1');
        let module2 = module_factory.create_module_for_slot(root, 'slot-1');
        expect(module1.factory_name).toEqual(module2.factory_name);
    });

    describe('referenced modules', function () {
        it('re-use the same instance when already created', function () {
            let module1 = module_factory.create_module_for_slot(root, 'slot-2');
            let module2 = module_factory.create_module_for_slot(module1, 'slot-1');
            let module3 = module_factory.create_module_for_slot(module2, 'slot-1');
            let module4;
            module3.reference_module('reference-1', (module) => {
                module4 = module;
            });
            expect(module2).toBe(module4);
        });

        it('re-use the same instance when not yet created', function () {
            let module1 = module_factory.create_module_for_slot(root, 'slot-2');
            let module2;
            module1.reference_module('reference-1', (module) => {
                module2 = module;
            });
            let module3 = module_factory.create_module_for_slot(module1, 'slot-1');
            expect(module2).toBe(module3);
        });

        it('references modules defined as named modules', function () {
            let module1 = module_factory.create_module_for_slot(root, 'slot-2');
            let module2 = module_factory.create_module_for_slot(module1, 'slot-1');
            let module3 = module_factory.create_module_for_slot(module2, 'optional-slot');
            let module4;
            module1.reference_module('reference-2', (module) => {
                module4 = module;
            });
            expect(module3).toBe(module4);
        });

        it('allows optional references', function () {
            let module1 = module_factory.create_module_for_slot(root, 'slot-2');
            let module2;
            module1.reference_module('optional-reference-1', (module) => {
                module2 = module;
            });
            expect(module2).toBeNull();
        });

        it('does not allow repeated ids', function () {
            expect(() => {
                let factory = new ModuleFactory.ModuleFactory({
                    app_json: NOT_UNIQUE_APP_JSON,
                    warehouse: warehouse,
                });
            }).toThrow();
        });

        it('does not allow references to modules inside or below multi slots', function () {
            expect(() => {
                let factory = new ModuleFactory.ModuleFactory({
                    app_json: IN_MULTI_APP_JSON,
                    warehouse: warehouse,
                });
            }).toThrow();
        });
    });

    describe('properties', function () {
        let parent;

        beforeEach(function () {
            let module = module_factory.create_module_for_slot(root, 'slot-2');
            parent = module_factory.create_module_for_slot(module, 'slot-2');
        });

        it('can be passed in on module creation', function () {
            let test_constructor = jasmine.createSpy('TestModuleConstructor');
            warehouse.type_to_class.and.returnValue(test_constructor);
            module_factory.create_module_for_slot(root, 'slot-1', {
                foo: 'bar',
            });
            expect(test_constructor).toHaveBeenCalledWith(jasmine.objectContaining({
                foo: 'bar',
            }));
        });

        it('are parsed from the app json', function () {
            let module = module_factory.create_module_for_slot(parent, 'slot-1');
            expect(module.expand).toBe(true);
            expect(module.width_request).toBe(200);
        });

        it('function with enum names in app json', function () {
            let module = module_factory.create_module_for_slot(parent, 'slot-1');
            expect(module.halign).toBe(Gtk.Align.END);
        });

        it('warn if not found on module class', function () {
            spyOn(window, 'logError');
            let module = module_factory.create_module_for_slot(parent, 'slot-2');
            module = module_factory.create_module_for_slot(module, 'slot-1');
            expect(logError).toHaveBeenCalled();
        });

        it('warn if not enum value not found', function () {
            spyOn(window, 'logError');
            let module = module_factory.create_module_for_slot(parent, 'slot-2');
            module = module_factory.create_module_for_slot(module, 'slot-2');
            expect(logError).toHaveBeenCalled();
        });
    });
});
