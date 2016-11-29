const GObject = imports.gi.GObject;

const ContentObjectModel = imports.search.contentObjectModel;
const Filter = imports.app.interfaces.filter;
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
    let filter, models;

    const MODELS = [
        { title: 'a' },
        { title: 'b' },
        { title: 'batman' },
        { title: 'none' },
        { title: 'abba' },
    ];

    beforeEach(function () {
        let factory = new MockFactory.MockFactory({
            type: AFilter,
            slots: {
                'sub-filter': {
                    type: BFilter,
                },
            },
        });
        filter = factory.create_root_module();
        models = MODELS.map(properties =>
            new ContentObjectModel.ContentObjectModel(properties));
    });

    it('filters models correctly', function () {
        expect(filter.include(models[0])).toBeFalsy();
        expect(filter.include(models[1])).toBeFalsy();
        expect(filter.include(models[2])).toBeTruthy();
        expect(filter.include(models[3])).toBeFalsy();
        expect(filter.include(models[4])).toBeTruthy();
    });
});
