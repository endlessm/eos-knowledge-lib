// Copyright 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const Featured = imports.app.modules.order.featured;
const MockFactory = imports.tests.mockFactory;

describe('Order.Featured', function () {
    let order, models, factory;

    const UNSORTED = [
        false,
        true,
        true,
        false,
    ];

    const SORTED = [
        true,
        true,
        false,
        false,
    ];

    beforeEach(function () {
        models = UNSORTED.map(featured =>
            new ContentObjectModel.ContentObjectModel({
                featured: featured,
        }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', Featured.Featured);
            order = factory.create_named_module('order');
        });

        it('is the default', function () {
            expect(order.ascending).toBeTruthy();
        });

        it('sorts models by placing featured before non-featured', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.featured)).toEqual(SORTED);
        });
    });

    describe('descending', function () {
        beforeEach(function () {
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', Featured.Featured, {}, {
                ascending: false,
            });
            order = factory.create_named_module('order');
        });

        it('sorts models by placing non-featured before featured', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.featured)).toEqual(SORTED.reverse());
        });
    });
});
