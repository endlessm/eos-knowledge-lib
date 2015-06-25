const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.reader.card;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Reader Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new Card.Card();
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
                model: new ContentObjectModel.ContentObjectModel({
                    title: 'Barry Bonds',
                    synopsis: 'Homerun king',
                }),
                style_variant: 0,
                page_number: 25,
            }, {
                model: new ContentObjectModel.ContentObjectModel({
                    title: 'Hank Aaron',
                    synopsis: 'Hammering Hank',
                }),
                style_variant: 1,
                page_number: 44,
            }, {
                model: new ContentObjectModel.ContentObjectModel({
                    title: 'Babe Ruth',
                    synopsis: 'The Bambino',
                }),
                style_variant: 2,
                page_number: 3,
            }].map((props) => {
                return new Card.Card(props);
            });

            cards.map(function (card, index) {
                expect(card).toHaveCssClass('reader-card' + (index));
            });
        });
    });
});
