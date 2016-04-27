// Copyright (C) 2016 Endless Mobile, Inc.

const ArticleObjectModel = imports.search.articleObjectModel;
const MockFactory = imports.tests.mockFactory;
const PublishedDateOrder = imports.app.modules.publishedDateOrder;

describe('Published date order', function () {
    let order, models, factory;

    const UNSORTED_DATES = [
        '2013-07-03T00:00:00',
        '2013-07-03T00:00:00',
        '2014-07-03T00:00:00',
        '',
        '2012-07-03T00:00:00',
    ];
    const SORTED_DATES = [
        '',
        '2012-07-03T00:00:00',
        '2013-07-03T00:00:00',
        '2013-07-03T00:00:00',
        '2014-07-03T00:00:00',
    ];

    beforeEach(function () {
        models = UNSORTED_DATES.map(date =>
            new ArticleObjectModel.ArticleObjectModel({ published: date }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', PublishedDateOrder.PublishedDateOrder);
            order = factory.create_named_module('order');
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
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', PublishedDateOrder.PublishedDateOrder, {}, {
                ascending: false,
            });
            order = factory.create_named_module('order');
        });

        it('sorts models by published date', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.published)).toEqual(SORTED_DATES.reverse());
        });
    });
});
