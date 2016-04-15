// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Module = imports.app.interfaces.module;

Gtk.init(null);

describe('Module interface', function () {
    let module;

    beforeEach(function () {
        let mock_factory = new MockFactory.MockFactory();

        module = new Minimal.MinimalModule({
            factory: mock_factory,
        });
    });

    it ('Constructs', function () {});

    it('reports having no slots by default', function () {
        expect(module.get_slot_names()).toEqual([]);
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
});
