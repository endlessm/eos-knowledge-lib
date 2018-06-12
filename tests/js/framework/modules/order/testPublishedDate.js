// Copyright 2016 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const MockFactory = imports.tests.mockFactory;
const PublishedDate = imports.framework.modules.order.publishedDate;

describe('Order.PublishedDate', function () {
    let order, models;

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
        models = UNSORTED_DATES.map(published => new DModel.Article({published}));
    });

    describe('ascending', function () {
        beforeEach(function () {
            [order] = MockFactory.setup_tree({
                type: PublishedDate.PublishedDate,
            });
        });

        it('is the default', function () {
            expect(order.ascending).toBeTruthy();
        });

        it('sorts models by published date', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.published)).toEqual(SORTED_DATES);
        });

        it('queries models by date', function () {
            let query = order.modify_xapian_query(new DModel.Query());
            expect(query.order).toEqual(DModel.QueryOrder.ASCENDING);
            expect(query.sort).toEqual(DModel.QuerySort.DATE);
        });
    });

    describe('descending', function () {
        beforeEach(function () {
            [order] = MockFactory.setup_tree({
                type: PublishedDate.PublishedDate,
                properties: {
                    'ascending': false,
                },
            });
        });

        it('sorts models by published date', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.published)).toEqual(SORTED_DATES.reverse());
        });

        it('queries models by date', function () {
            let query = order.modify_xapian_query(new DModel.Query());
            expect(query.order).toEqual(DModel.QueryOrder.DESCENDING);
            expect(query.sort).toEqual(DModel.QuerySort.DATE);
        });
    });
});
