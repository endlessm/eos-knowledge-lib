// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Module = imports.app.interfaces.module;

Gtk.init(null);

describe('Module interface', function () {
    let module;

    beforeEach(function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalModule,
        });
        module = factory.create_module_tree();
    });

    it('reports having no slots if none defined in Slots', function () {
        expect(Minimal.MinimalModule.get_slot_names()).toEqual([]);
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
