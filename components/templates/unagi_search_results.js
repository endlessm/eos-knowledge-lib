const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Builder = imports.builder;
const SearchResultsPage = imports.interfaces.search_results_page;

const UnagiSearchResults = new Lang.Class({
    Name: 'UnagiSearchResults',
    Extends: SearchResultsPage.SearchResultsPage,
    Template: 'resource:///com/endlessm/test/data/unagi_search_results.ui.xml',
    InternalChildren: ['frame', 'back_button'],

    _init: function (props={}) {
        this.parent(props);
        this.init_template();
        this.add(this._frame);
    },
});
Builder.bind_template(UnagiSearchResults.prototype);

function create_me(props) {
    return new UnagiSearchResults(props);
}
