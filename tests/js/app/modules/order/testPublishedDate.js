// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;
Gtk.init(null);

const MockFactory = imports.tests.mockFactory;
const PublishedDate = imports.app.modules.order.publishedDate;

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
        models = UNSORTED_DATES.map(date =>
            Eknc.ArticleObjectModel.new_from_props({ published: date }));
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
    });
});
