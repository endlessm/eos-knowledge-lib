const Eknc = imports.gi.EosKnowledgeContent;

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
        order = factory.create_root_module();
        models = UNSORTED.map(properties =>
            Eknc.ContentObjectModel.new_from_props(properties));
    });

    it('sorts models correctly', function () {
        expect(models.sort(order.compare.bind(order)).map((model) => {
            return { title: model.title, synopsis: model.synopsis };
        })).toEqual(SORTED);
    });
});
