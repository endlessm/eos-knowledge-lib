// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ListArrangement = imports.app.modules.listArrangement;

Gtk.init(null);

Compliance.test_arrangement_compliance(ListArrangement.ListArrangement);
Compliance.test_arrangement_fade_in_compliance(ListArrangement.ListArrangement);
