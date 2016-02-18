// Copyright 2016 Endless Mobile, Inc.

const FeaturedOrder = imports.app.modules.featuredOrder;
const ContentObjectModel = imports.search.contentObjectModel;

describe('Featured order', function () {
    let order, models;

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
            order = new FeaturedOrder.FeaturedOrder();
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
            order = new FeaturedOrder.FeaturedOrder({
                ascending: false,
            });
        });

        it('sorts models by placing non-featured before featured', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.featured)).toEqual(SORTED.reverse());
        });
    });
});
