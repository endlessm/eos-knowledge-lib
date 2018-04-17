const {Gtk} = imports.gi;

const {SearchBox} = imports.app.widgets.searchBox;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('SearchBox', function () {
    let search_box;

    beforeEach(function () {
        search_box = new SearchBox();
    });

    it('emits no signal when you change the text programmatically', function () {
        search_box.connect('text-changed', () => fail());
        search_box.set_text_programmatically('some text');
        Utils.update_gui();
    });
});
