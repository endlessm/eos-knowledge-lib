const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Module = imports.app.interfaces.module;

const SearchBox = imports.app.modules.searchBox;

const HomePage = new Lang.Interface({
    Name: 'HomePage',
    GTypeName: 'EknHomePageEncyclopediaInterface',
    Requires: [ GObject.Object, Module.Module ],

    Properties: {
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
});
