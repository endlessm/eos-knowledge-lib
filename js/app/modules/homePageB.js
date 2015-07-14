const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = imports.app.modules.homePage;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

const HomePageB = new Lang.Class({
    Name: 'HomePageB',
    GTypeName: 'EknHomePageB',
    Extends: HomePage.HomePage,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/homePageB.ui',
    InternalChildren: ['top_left', 'top_right', 'bottom' ],

    _init: function (props={}) {
        this.parent(props);
        this.pack_module();
    },

    get_slot_names: function () {
        return this.constructor.InternalChildren;
    },

    pack_cards: function (cards) {
        let _allowed_card_numbers = [4, 6, 8];
        if (_allowed_card_numbers.indexOf(cards.length) < 0)
            printerr('Should only set 4, 6 or 8 cards in template B. ' + cards.length);

        this._card_container = this._bottom;

        for (let card of this._card_container.get_children()) {
            this._card_container.remove(card);
        }
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        // let columns = this._cards.length === 6 ? 3 : 4;
        let columns = cards.length / 2;
        let i = 0;
        for (let card of cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this._card_container.attach(card, col, row, 1, 1);
            i++;
        }
    },
});
