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

    // Do we want to bubble signals up through containers? I kind of think that
    // we have to, if we want to keep things modular. I did prefer not to do
    // this in the old system, but I think it's inevitable now.
    on_back_button_clicked: function () {
        this.emit('linear-go-back');
    },
});
Builder.bind_template(UnagiSearchResults.prototype);

function create_me(props) {
    return new UnagiSearchResults(props);
}
