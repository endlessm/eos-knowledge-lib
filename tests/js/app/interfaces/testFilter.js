const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const Module = imports.app.interfaces.module;

const AFilter = new Module.Class({
    Name: 'AFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    include_impl: function (model) {
        return model.title.indexOf('a') >= 0;
    },
});

const BFilter = new Module.Class({
    Name: 'BFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    include_impl: function (model) {
        return model.title.indexOf('b') >= 0;
    },
});

describe('Filter interface', function () {
    const MODELS = [
        { title: 'a' },
        { title: 'b' },
        { title: 'batman' },
        { title: 'none' },
        { title: 'abba' },
    ];

    it('filters models correctly', function () {
        let factory = new MockFactory.MockFactory({
            type: AFilter,
            slots: {
                'sub-filter': {
                    type: BFilter,
                },
            },
        });
        let filter = factory.create_root_module();
        let models = MODELS.map(properties =>
            Eknc.ContentObjectModel.new_from_props(properties));

        expect(filter.include(models[0])).toBeFalsy();
        expect(filter.include(models[1])).toBeFalsy();
        expect(filter.include(models[2])).toBeTruthy();
        expect(filter.include(models[3])).toBeFalsy();
        expect(filter.include(models[4])).toBeTruthy();
    });

    it('gives a hint to a Xapian query', function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalXapianFilter,
        });
        let filter = factory.create_root_module();
        let query = new Eknc.QueryObject();
        query = filter.modify_xapian_query(query);
        expect(query.tags_match_all).toEqual(['EknIncludeMe']);
    });

    it('lets the sub-filter influence the Xapian query', function () {
        let factory = new MockFactory.MockFactory({
            type: Minimal.MinimalXapianFilter,
            slots: {
                'sub-filter': {
                    type: Minimal.MinimalXapianFilter,
                    properties: {
                        'tag-to-include': 'EknAnotherTag',
                    },
                },
            },
        });
        let filter = factory.create_root_module();
        let query = new Eknc.QueryObject();
        query = filter.modify_xapian_query(query);
        expect(query.tags_match_all).toEqual(['EknIncludeMe', 'EknAnotherTag']);
    });

    it('delegates modifying the Xapian query to the sub-filter if the top does not do it', function () {
        let factory = new MockFactory.MockFactory({
            type: AFilter,
            slots: {
                'sub-filter': {
                    type: Minimal.MinimalXapianFilter,
                },
            },
        });
        let filter = factory.create_root_module();
        let query = new Eknc.QueryObject();
        query = filter.modify_xapian_query(query);
        expect(query.tags_match_all).toEqual(['EknIncludeMe']);
    });
});
