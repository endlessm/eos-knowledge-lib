// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Constrained = imports.framework.modules.arrangement.constrained;
const Utils = imports.tests.utils;

Gtk.init(null);

Compliance.test_arrangement_compliance(Constrained.Constrained);
