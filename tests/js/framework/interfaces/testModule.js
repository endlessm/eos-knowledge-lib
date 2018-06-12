// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Module = imports.framework.interfaces.module;

Gtk.init(null);

describe('Module interface', function () {
    let module;

    beforeEach(function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalModule,
        });
        module = factory.create_root_module();
    });

    it('reports having no slots if none defined in Slots', function () {
        expect(Minimal.MinimalModule.get_slot_names()).toEqual([]);
    });

    it('calls callback for make_ready if no slots defined', function (done) {
        module.make_ready(() => {
            done();
        });
    });

    it('does not throw error if no callback provided for make_ready', function () {
        expect(() => {
            module.make_ready();
        }).not.toThrow();
    });
});

const MinimalModuleWithSlots = new Module.Class({
    Name: 'MinimalModuleWithSlots',
    Extends: GObject.Object,
    Slots: {
        submodule1: {},
        submodule2: {},
    },
});

describe('Module with slots', function () {
    let module;

    beforeEach(function () {
        let factory = new MockFactory.MockFactory({
            type: MinimalModuleWithSlots,
            slots: {
                submodule1: {type: Minimal.MinimalModule},
                submodule2: {type: Minimal.MinimalModule},
            },
        });
        module = factory.create_root_module();
    });

    it('calls make_ready() on its submodules', function () {
        let submodule1 = module.create_submodule('submodule1');
        let submodule2 = module.create_submodule('submodule2');
        spyOn(submodule1, 'make_ready').and.callThrough();
        spyOn(submodule2, 'make_ready').and.callThrough();

        module.make_ready();
        expect(submodule1.make_ready).toHaveBeenCalled();
        expect(submodule2.make_ready).toHaveBeenCalled();
    });

    it('starts with an empty submodules array', function () {
        expect(module.get_submodules()).toEqual([]);
    });

    it('adds submodules to array when they are created', function () {
        let submodule1 = module.create_submodule('submodule1');
        expect(module.get_submodules()).toEqual([submodule1]);
    });
});

describe('Module metaclass', function () {
    it('automatically implements Module', function () {
        const MyNewModule = new Module.Class({
            Name: 'MyNewModule',
            Extends: GObject.Object,
        });
        expect(MyNewModule.implements(Module.Module)).toBeTruthy();
    });

    it('pulls in slots from implemented interfaces', function () {
        const MySlotInterface = new Lang.Interface({
            Name: 'MySlotInterface',
            Requires: [Module.Module],
            Slots: {
                'interface-slot': {},
            },
        });
        const MySlotModule = new Module.Class({
            Name: 'MySlotModule',
            Extends: GObject.Object,
            Implements: [MySlotInterface],
            Slots: {
                'module-slot': {},
            },
        });
        expect(MySlotModule.get_slot_names()).toContain('interface-slot');
        expect(MySlotModule.get_slot_names()).toContain('module-slot');
    });

    it('pulls in slots from parent classes', function () {
        const MySlotParent = new Module.Class({
            Name: 'MySlotParent',
            Extends: GObject.Object,
            Slots: {
                'parent-slot': {},
            },
        });
        const MySlotChild = new Module.Class({
            Name: 'MySlotChild',
            Extends: MySlotParent,
            Slots: {
                'child-slot': {},
            },
        });
        expect(MySlotChild.get_slot_names()).toContain('parent-slot');
        expect(MySlotChild.get_slot_names()).toContain('child-slot');
    });

    it('does not allow dots in slot names', function () {
        expect(() => new Module.Class({
            Name: 'MyDotModule',
            Extends: GObject.Object,
            Slots: {
                'dot.slot': {},
            },
        })).toThrow();
    });
});

describe('Introspection', function () {
    let info;
    beforeEach(function () {
        info = Minimal.MinimalArrangement.introspect();
    });

    it('provides YAML module name', function () {
        expect(info.name).toEqual('MinimalArrangement');
    });

    it('provides GType name', function () {
        expect(info.gtype).toEqual('EknMinimalArrangement');
    });

    it('provides GType name of parent', function () {
        expect(info.parent).toEqual('GtkGrid');
    });

    it('provides implemented interfaces', function () {
        expect(info.interfaces).toEqual(jasmine.arrayContaining([
            'Gjs_Module',
            'EknArrangement',
        ]));
    });

    it('provides properties from the object', function () {
        expect(info.properties).toContain(jasmine.objectContaining({
            name: 'max-cards',
            type: 'Number',
            default: -1,
            readable: true,
            writable: true,
            construct: true,
            construct_only: false,
            origin: 'EknMinimalArrangement',
        }));
    });

    it('provides properties from interfaces', function () {
        expect(info.properties).toContain(jasmine.objectContaining({
            name: 'all-visible',
            origin: 'EknArrangement',
        }));
    });

    it('provides slots', function () {
        expect(info.slots).toContain(jasmine.objectContaining({
            name: 'card',
            array: false,
            multi: true,
        }));
    });

    it('provides references', function () {
        expect(info.references).toEqual([]);
    });
});
