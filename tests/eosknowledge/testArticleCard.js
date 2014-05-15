const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

describe('Article card widget', function () {
    let card;

    beforeEach(function () {
        card = new EosKnowledge.ArticleCard();
    });

    it('passes a test', function () {});
});
