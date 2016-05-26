const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

describe('Order interface', function () {
    let order, models;

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
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalOrder,
            slots: {
                'sub-order': {
                    type: Minimal.MinimalOrder,
                    properties: {
                        'model-prop': 'synopsis',
                    },
                },
            },
        });
        order = factory.create_module_tree();
        models = UNSORTED.map(properties =>
            new ContentObjectModel.ContentObjectModel(properties));
    });

    it('sorts models correctly', function () {
        expect(models.sort(order.compare.bind(order)).map((model) => {
            return { title: model.title, synopsis: model.synopsis };
        })).toEqual(SORTED);
    });
});
