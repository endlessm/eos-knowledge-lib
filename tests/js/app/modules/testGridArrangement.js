// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const GridArrangement = imports.app.modules.gridArrangement;

Gtk.init(null);

Compliance.test_arrangement_compliance(GridArrangement.GridArrangement);
Compliance.test_arrangement_fade_in_compliance(GridArrangement.GridArrangement);
