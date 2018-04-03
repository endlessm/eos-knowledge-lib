// Copyright 2017 Endless Mobile, Inc.

const {DModel} = imports.gi;

const MockFactory = imports.tests.mockFactory;
const Tagged = imports.app.modules.filter.tagged;

describe('Filter.Tagged', function () {
    const MODELS = [
        new DModel.Content({
            tags: ['a', 'b', 'd'],
        }),
        new DModel.Set({
            tags: ['a', 'b', 'c'],
        }),
    ];
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Tagged.Tagged,
                properties: {
                    'tag': 'c',
                },
            });
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a model without the tag', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });

        it('queries only models with the tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.tags_match_all).toContain('c');
        });
    });

    describe('inverse mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Tagged.Tagged,
                properties: {
                    'invert': true,
                    'tag': 'c',
                }
            });
        });

        it('filters out a model with the tag', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });

        it('queries only models without the tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_tags).toContain('c');
        });
    });
});
