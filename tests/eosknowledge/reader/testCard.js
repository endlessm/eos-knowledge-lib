const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Reader Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new EosKnowledge.Reader.Card();
    });

    it('constructs', function () {});

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass('reader-card');
        });

        it('has a descendant with title class', function () {
            expect(card).toHaveDescendantWithCssClass('title');
        });

        it('sets style variant classes to variants [0, 2].', function () {
            let cards = [{
                title: 'Barry Bonds',
                synopsis: 'Homerun king',
                style_variant: 0,
                page_number: 25,
            }, {
                title: 'Hank Aaron',
                synopsis: 'Hammering Hank',
                style_variant: 1,
                page_number: 44,
            }, {
                title: 'Babe Ruth',
                synopsis: 'The Bambino',
                style_variant: 2,
                page_number: 3,
            }].map((props) => {
                return new EosKnowledge.Reader.Card(props);
            });

            cards.map(function (card, index) {
                expect(card).toHaveCssClass('reader-card' + (index));
            });
        });
    });
});
