const Gtk = imports.gi.Gtk;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;

function descendant_has_class (widget, style_class) {
    if (widget.get_style_context().has_class(style_class))
        return true;
    if (widget instanceof Gtk.Container) {
        let children = [];
        widget.forall(function (child) { children.push(child); });
        for (let child of children) {
            if (descendant_has_class(child, style_class))
                return true;
        }
    }
    return false;
}

describe('Card widget', function () {
    let card;

    beforeEach(function () {
        card = new EosKnowledge.Card();
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card.get_style_context().has_class('card')).toBe(true);
        });
        it('has a descendant with title class', function () {
            expect(descendant_has_class(card, 'title')).toBe(true);
        });
        it('has a descendant with subtitle class', function () {
            expect(descendant_has_class(card, 'subtitle')).toBe(true);
        });
        it('has a descendant with thumbnail class', function () {
            expect(descendant_has_class(card, 'thumbnail')).toBe(true);
        });
    });
});
