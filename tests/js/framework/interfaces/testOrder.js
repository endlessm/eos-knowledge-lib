const {DModel} = imports.gi;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

describe('Order interface', function () {
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

    it('sorts models correctly', function () {
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
        let order = factory.create_root_module();
        let models = UNSORTED.map(props => new DModel.Content(props));

        expect(models.sort(order.compare.bind(order)).map((model) => {
            return { title: model.title, synopsis: model.synopsis };
        })).toEqual(SORTED);
    });

    it('gives a hint to a Xapian query', function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalXapianOrder,
        });
        let order = factory.create_root_module();
        let query = new DModel.Query({
            search_terms: 'foobar',
        });
        query = order.modify_xapian_query(query);
        expect(query.search_terms).toEqual('foobar title');
    });

    it('does not let the sub-order influence the Xapian query', function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalXapianOrder,
            slots: {
                'sub-order': {
                    type: Minimal.MinimalXapianOrder,
                    properties: {
                        'model-prop': 'synopsis',
                    },
                },
            },
        });
        let order = factory.create_root_module();
        let query = new DModel.Query({
            search_terms: 'foobar',
        });
        query = order.modify_xapian_query(query);
        expect(query.search_terms).not.toMatch('synopsis');
    });

    it('delegates modifying the Xapian query to the sub-order if the top does not do it', function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalOrder,
            slots: {
                'sub-order': {
                    type: Minimal.MinimalXapianOrder,
                    properties: {
                        'model-prop': 'synopsis',
                    },
                },
            },
        });
        let order = factory.create_root_module();
        let query = new DModel.Query({
            search_terms: 'foobar',
        });
        query = order.modify_xapian_query(query);
        expect(query.search_terms).toEqual('foobar synopsis');
    });
});
