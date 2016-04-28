// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;

Gtk.init(null);

describe('Interaction interface', function () {
    let interaction;

    beforeEach(function () {
        interaction = new Minimal.MinimalInteraction();
    });

    it('can be constructed', function () {
        expect(interaction).toBeDefined();
    });
});
