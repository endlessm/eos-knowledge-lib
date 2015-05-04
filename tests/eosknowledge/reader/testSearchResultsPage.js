const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

describe('Search Results Page', function () {
    let page;

    beforeEach(function () {
        page = new EosKnowledge.Reader.SearchResultsPage();
    });

    it('constructs', function () {});
});
