const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const SearchBox = imports.app.modules.searchBox;

/**
 * Class: EncyclopediaCoverTemplate
 *
 * A Template used for the cover of encyclopedia apps.
 *
 * CSS Styles:
 *      encyclopedia-cover-template - on the template
 *
 */
const EncyclopediaCoverTemplate = new Lang.Class({
    Name: 'EncyclopediaCoverTemplate',
    GTypeName: 'EknEncyclopediaCoverTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The seach box for this view.',
            GObject.ParamFlags.READABLE,
            SearchBox.SearchBox),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/encyclopediaCoverTemplate.ui',

    _init: function (props={}) {
        this.parent(props);

        const PACKING_ARGS = {
            'top': [0, 0, 1, 1],
            'bottom': [0, 1, 1, 1],
        };
        this.get_slot_names().forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this.attach.bind(this, submodule).apply(this, PACKING_ARGS[slot]);
            this['_' + slot] = submodule;
        });

        // FIXME: this lines should be replaced by the dispatcher
        this.search_box = this._bottom;
    },

    get_slot_names: function () {
        return [ 'top', 'bottom' ];
    },
});
