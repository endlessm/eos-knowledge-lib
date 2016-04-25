// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

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
