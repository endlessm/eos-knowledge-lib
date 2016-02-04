// Copyright 2015 Endless Mobile, Inc.

/* exported OverflowArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const SpaceContainer = imports.app.widgets.spaceContainer;
const Module = imports.app.interfaces.module;

const OverflowArrangement = new Lang.Class({
    Name: 'OverflowArrangement',
    GTypeName: 'EknOverflowArrangement',
    Extends: SpaceContainer.SpaceContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        // 'spacing' already implemented by SpaceContainer
    },
});
