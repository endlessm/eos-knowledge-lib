// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const MeshInteraction = imports.app.modules.meshInteraction;

Gtk.init(null);

describe('Mesh interaction', function () {
    let mesh;

    beforeEach(function () {
        mesh = new MeshInteraction.MeshInteraction();
    });

    it('can be constructed', function () {});
});
