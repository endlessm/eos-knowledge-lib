const Gtk = imports.gi.Gtk;

const ListCard = imports.app.listCard;

Gtk.init(null);

describe('List card widget', function () {
    let card;

    beforeEach(function () {
        card = new ListCard.ListCard();
    });

    it('passes a test', function () {});
});
