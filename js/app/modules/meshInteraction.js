// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.launcher;
const Module = imports.app.interfaces.module;

/**
 * Class: MeshInteraction
 *
 * The Mesh interaction model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory interaction, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const MeshInteraction = new Lang.Class({
    Name: 'MeshInteraction',
    GTypeName: 'EknMeshInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'engine': GObject.ParamSpec.override('engine', Interaction.Interaction),
        'view': GObject.ParamSpec.override('view', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
    },

    _init: function (props) {
        this.parent(props);
    },

    // Launcher implementation
    desktop_launch: function (timestamp) {},
});
