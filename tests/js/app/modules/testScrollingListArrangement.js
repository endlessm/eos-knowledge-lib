// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ScrollingListArrangement = imports.app.modules.scrollingListArrangement;

Gtk.init(null);

Compliance.test_arrangement_compliance(ScrollingListArrangement.ScrollingListArrangement);
Compliance.test_arrangement_fade_in_compliance(ScrollingListArrangement.ScrollingListArrangement);
