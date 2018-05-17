// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
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
                                styles: [
                                    'a-style-class',
                                    'b-style-class',
                                ],
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
                            // Example of binding modules properties
                            'optional-slot': {
                                type: 'TestModule',
                                slots: {
                                    'slot-1': {
                                        type: 'MinimalCard',
                                        properties: {
                                            'visible': {
                                                'binding': {
                                                    'source-id': 'entangled-card',
                                                    'property': 'visible',
                                                },
                                            },
                                        },
                                    },
                                    'slot-2': {
                                        type: 'MinimalCard',
                                        properties: {
                                            'expand': {
                                                'binding': {
                                                    'source-id': 'entangled-card',
                                                    'property': 'expand',
                                                    'invert': true,
                                                },
                                            },
                                        },
                                    },
                                    'optional-slot': {
                                        type: 'MinimalCard',
                                        id: 'entangled-card',
                                        properties: {
                                            'visible': false,
                                            'expand': false,
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
            'multi-slot-1': {
                type: 'TestModule',
                slots: {
                    'slot-1': {
                        type: 'TestModule',
                    },
                },
            },
            'array-slot': [
                {
                    type: 'TestModule',
                    slots: {
                        'slot-1': {
                            type: 'TestModule',
                        },
                    },
                },
                {
                    type: 'TestModule',
                    slots: {
                        'slot-1': {
                            type: 'TestModule',
                        },
                    },
                }
            ]
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

const NO_STYLE_SUPPORT_APP_JSON = {
    version: 2,
    root: {
        type: 'TestModule',
        styles: [
            'a-style-class',
        ],
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
        },
        'array-slot': {
            array: true,
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
    GTypeName: 'testModuleFactory_MockWarehouse',
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
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        warehouse = new MockWarehouse();
        module_factory = new ModuleFactory.ModuleFactory({
            app_json: MOCK_APP_JSON,
            warehouse: warehouse,
        });
        spyOn(warehouse, 'type_to_class').and.callThrough();
        root = module_factory.create_root_module();
    });

    it ('creates the root module', function () {
        expect(root).toBeDefined();
    });

    it ('errors if the root module created twice', function () {
        expect(() => module_factory.create_root_module()).toThrow();
    });

    it ('get_root_module gives a reference to the root module', function () {
        expect(module_factory.get_root_module()).toBe(root);
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

    it('errors if creating more than one instance of non-multi slot', function () {
        module_factory.create_module_for_slot(root, 'slot-1');
        expect(() => {
            module_factory.create_module_for_slot(root, 'slot-1');
        }).toThrow();
    });

    it('creates a module for a module definition in a slot', function () {
        let module = module_factory.create_module_for_slot(root, 'slot-1');
        expect(module).toBeA(MockModule);
    });

    it('creates a module with a module tree path', function () {
        let module = module_factory.create_module_for_slot(root, 'slot-1');
        expect(module.factory_path).toBe('root.slot-1');
    });

    it('creates modules from the same multi slot with different paths', function () {
        let module1 = module_factory.create_module_for_slot(root, 'multi-slot-1');
        let module2 = module_factory.create_module_for_slot(root, 'multi-slot-1');
        expect(module1.factory_path).not.toEqual(module2.factory_path);
    });

    it('creates submodules of multi slots with different paths', function () {
        let module1 = module_factory.create_module_for_slot(root, 'multi-slot-1');
        let module2 = module_factory.create_module_for_slot(root, 'multi-slot-1');
        let sub1 = module_factory.create_module_for_slot(module1, 'slot-1');
        let sub2 = module_factory.create_module_for_slot(module2, 'slot-1');
        expect(sub1.factory_path).not.toEqual(sub2.factory_path);
    });

    it('assigns style classes to the module', function () {
        let module1 = module_factory.create_module_for_slot(root, 'slot-2');
        let module2 = module_factory.create_module_for_slot(module1, 'slot-2');
        let module3 = module_factory.create_module_for_slot(module2, 'slot-1');
        expect(module3).toHaveCssClass('a-style-class');
        expect(module3).toHaveCssClass('b-style-class');
    });

    it('does not allow style in modules that does not support it', function () {
        expect(() => {
            new ModuleFactory.ModuleFactory({
                app_json: NO_STYLE_SUPPORT_APP_JSON,
                warehouse: warehouse,
            });
        }).toThrow();
    });

    describe('array modules', function () {
        it('are arrays', function () {
            let array_module = module_factory.create_module_for_slot(root, 'array-slot');
            expect(Array.isArray(array_module)).toBe(true);
        });

        it('create as many submodules as declared', function () {
            let array_module = module_factory.create_module_for_slot(root, 'array-slot');
            expect(array_module.length).toEqual(2);
        });
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

        it('can bind between modules', function () {
            let module1 = module_factory.create_module_for_slot(parent, 'optional-slot');
            let module2 = module_factory.create_module_for_slot(module1, 'slot-1');
            expect(module2.visible).toEqual(true);
            module_factory.create_module_for_slot(module1, 'optional-slot');
            expect(module2.visible).toEqual(false);
        });

        it('can bind inversely between modules', function () {
            let module1 = module_factory.create_module_for_slot(parent, 'optional-slot');
            let module2 = module_factory.create_module_for_slot(module1, 'slot-2');
            expect(module2.expand).toEqual(false);
            module_factory.create_module_for_slot(module1, 'optional-slot');
            expect(module2.expand).toEqual(true);
        });
    });
});

describe('Custom Modules', function () {
    let root, module_factory;

    beforeEach(function () {
        module_factory = new ModuleFactory.ModuleFactory({
            app_json: {
                version: 2,
                root: {
                    type: 'Layout.Box',
                    slots: {
                        contents: [
                            {
                                type: 'Custom.Custom',
                            },
                            {
                                type: 'Layout.Custom',
                            },
                        ],
                    },
                },
            },
        });
        root = module_factory.create_root_module();
    });

    it ('handles new modules', function () {
        expect(root).toBeDefined();
    });

    it('handles imports between new modules', function () {
        expect(Gtk.test_find_label(root, 'Overridden')).not.toBeNull();
    });
});
