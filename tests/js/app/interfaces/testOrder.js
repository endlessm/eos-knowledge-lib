// Copyright (C) 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

describe('Order interface', function () {
    let order, models, factory;

    const SORTED = [
        { title: 'A', synopsis: 'A' },
        { title: 'A', synopsis: 'B' },
        { title: 'B', synopsis: 'B' },
        { title: 'C', synopsis: 'A' },
        { title: 'C', synopsis: 'B' },
    ];

    const UNSORTED = [
        { title: 'C', synopsis: 'A' },
        { title: 'A', synopsis: 'B' },
        { title: 'C', synopsis: 'B' },
        { title: 'A', synopsis: 'A' },
        { title: 'B', synopsis: 'B' },
    ];

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('sub-order', Minimal.MinimalOrder, {}, {
            model_prop: 'synopsis',
        });
        factory.add_named_mock('order', Minimal.MinimalOrder, {
            'sub-order': 'sub-order',
        });
        order = factory.create_named_module('order');
        models = UNSORTED.map(properties =>
            new ContentObjectModel.ContentObjectModel(properties));
    });

    it('has a minimal implementation', function () {
        expect(order).toBeDefined();
    });

    it('sorts models correctly', function () {
        expect(models.sort(order.compare.bind(order)).map((model) => {
            return { title: model.title, synopsis: model.synopsis };
        })).toEqual(SORTED);
    });
});
