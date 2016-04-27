// Copyright (C) 2016 Endless Mobile, Inc.

const AlphabeticalOrder = imports.app.modules.alphabeticalOrder;
const ContentObjectModel = imports.search.contentObjectModel;
const MockFactory = imports.tests.mockFactory;

describe('Alphabetical order', function () {
    let order, models, factory;

    const UNSORTED_TITLES = ['Frilled shark', 'Goldfish', 'Squid',
        'Pistol shrimp', 'Jellyfish', 'Ocelot', 'Aardvark', 'Fruit bat',
        'Kangaroo', 'Jellyfish'];
    const SORTED_TITLES = ['Aardvark', 'Frilled shark', 'Fruit bat', 'Goldfish',
        'Jellyfish', 'Jellyfish', 'Kangaroo', 'Ocelot', 'Pistol shrimp', 'Squid'];

    beforeEach(function () {
        models = UNSORTED_TITLES.map(title =>
            new ContentObjectModel.ContentObjectModel({ title: title }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', AlphabeticalOrder.AlphabeticalOrder);
            order = factory.create_named_module('order');
        });

        it('is the default', function () {
            expect(order.ascending).toBeTruthy();
        });

        it('sorts models by title', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.title)).toEqual(SORTED_TITLES);
        });
    });

    describe('descending', function () {
        beforeEach(function () {
            factory = new MockFactory.MockFactory();
            factory.add_named_mock('order', AlphabeticalOrder.AlphabeticalOrder, {}, {
                ascending: false,
            });
            order = factory.create_named_module('order');
        });

        it('sorts models by title', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.title)).toEqual(SORTED_TITLES.reverse());
        });
    });
});
