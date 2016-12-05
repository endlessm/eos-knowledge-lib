// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Featured = imports.app.modules.order.featured;
const MockFactory = imports.tests.mockFactory;

describe('Order.Featured', function () {
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
            Eknc.ContentObjectModel.new_from_props({
                featured: featured,
        }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            [order] = MockFactory.setup_tree({
                type: Featured.Featured,
            });
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
            [order] = MockFactory.setup_tree({
                type: Featured.Featured,
                properties: {
                    'ascending': false,
                },
            });
        });

        it('sorts models by placing non-featured before featured', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.featured)).toEqual(SORTED.reverse());
        });
    });
});
