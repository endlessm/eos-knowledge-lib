const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ReaderCard = imports.app.modules.readerCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Reader Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new ReaderCard.ReaderCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
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
                model: new ArticleObjectModel.ArticleObjectModel({
                    title: 'Barry Bonds',
                    synopsis: 'Homerun king',
                    article_number: 0,
                }),
            }, {
                model: new ArticleObjectModel.ArticleObjectModel({
                    title: 'Hank Aaron',
                    synopsis: 'Hammering Hank',
                    article_number: 1,
                }),
            }, {
                model: new ArticleObjectModel.ArticleObjectModel({
                    title: 'Babe Ruth',
                    synopsis: 'The Bambino',
                    article_number: 2,
                }),
            }].map((props) => {
                return new ReaderCard.ReaderCard(props);
            });

            cards.map(function (card, index) {
                expect(card).toHaveCssClass('variant' + (index));
            });
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new ReaderCard.ReaderCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
