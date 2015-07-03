const Gtk = imports.gi.Gtk;

const ArticleCard = imports.app.modules.articleCard;

Gtk.init(null);

describe('Article card widget', function () {
    let card;

    beforeEach(function () {
        card = new ArticleCard.ArticleCard();
    });

    it('passes a test', function () {});
});
