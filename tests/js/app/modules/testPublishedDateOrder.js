// Copyright 2016 Endless Mobile, Inc.

const PublishedDateOrder = imports.app.modules.publishedDateOrder;
const ArticleObjectModel = imports.search.articleObjectModel;

describe('Published date order', function () {
    let order, models;

    const UNSORTED_DATES = [
        '2013-07-03T00:00:00',
        '2014-07-03T00:00:00',
        '',
        '2012-07-03T00:00:00',
    ];
    const SORTED_DATES = [
        '',
        '2012-07-03T00:00:00',
        '2013-07-03T00:00:00',
        '2014-07-03T00:00:00',
    ];

    beforeEach(function () {
        models = UNSORTED_DATES.map(date =>
            new ArticleObjectModel.ArticleObjectModel({ published: date }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            order = new PublishedDateOrder.PublishedDateOrder();
        });

        it('is the default', function () {
            expect(order.ascending).toBeTruthy();
        });

        it('sorts models by published date', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.published)).toEqual(SORTED_DATES);
        });
    });

    describe('descending', function () {
        beforeEach(function () {
            order = new PublishedDateOrder.PublishedDateOrder({
                ascending: false,
            });
        });

        it('sorts models by published date', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.published)).toEqual(SORTED_DATES.reverse());
        });
    });
});
