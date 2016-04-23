const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

/**
 * Class: EncyclopediaCoverTemplate
 *
 * A Template used for the cover of encyclopedia apps.
 *
 * CSS Styles:
 *      encyclopedia-cover-template - on the template
 *
 */
const EncyclopediaCoverTemplate = new Module.Class({
    Name: 'EncyclopediaCoverTemplate',
    GTypeName: 'EknEncyclopediaCoverTemplate',
    CssName: 'EknEncyclopediaCoverTemplate',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/encyclopediaCoverTemplate.ui',
    InternalChildren: [ 'grid' ],

    _init: function (props={}) {
        this.parent(props);

        this._grid.add(this.create_submodule('top'));
        this._grid.add(this.create_submodule('bottom'));
    },

    get_slot_names: function () {
        return [ 'top', 'bottom' ];
    },
});
