// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Alphabetical = imports.framework.modules.order.alphabetical;
const MockFactory = imports.tests.mockFactory;

describe('Order.Alphabetical', function () {
    let order, models, factory;

    const UNSORTED_TITLES = ['Frilled shark', 'Goldfish', 'Squid',
        'Pistol shrimp', 'Jellyfish', 'Ocelot', 'Aardvark', 'Fruit bat',
        'Kangaroo', 'Jellyfish'];
    const SORTED_TITLES = ['Aardvark', 'Frilled shark', 'Fruit bat', 'Goldfish',
        'Jellyfish', 'Jellyfish', 'Kangaroo', 'Ocelot', 'Pistol shrimp', 'Squid'];

    beforeEach(function () {
        models = UNSORTED_TITLES.map(title => new DModel.Content({title}));
        factory = new MockFactory.MockFactory({
            type: Alphabetical.Alphabetical,
        });
    });

    describe('ascending', function () {
        beforeEach(function () {
            order = factory.create_root_module();
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
            order = factory.create_root_module({
                ascending: false,
            });
        });

        it('sorts models by title', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.title)).toEqual(SORTED_TITLES.reverse());
        });
    });
});
