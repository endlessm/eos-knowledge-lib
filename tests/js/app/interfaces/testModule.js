// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const MinimalModule = imports.tests.minimalModule;
const MockFactory = imports.tests.mockFactory;

describe('Module interface', function () {
    let module;

    beforeEach(function () {
        let mock_factory = new MockFactory.MockFactory();

        module = new MinimalModule.MinimalModule({
            factory: mock_factory,
        });
    });

    it ('Constructs', function () {});

    it ('returns default value for get_slot_names method', function () {
        expect(module.get_slot_names()).toEqual([]);
    });
});
