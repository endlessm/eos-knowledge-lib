// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const MockFactory = imports.tests.mockFactory;
const Sets = imports.app.modules.filter.sets;

describe('Filter.Sets', function () {
    const MODELS = [
        new DModel.Content({
            tags: ['a', 'b', 'EknArticleObject'],
        }),
        new DModel.Set({
            tags: ['a', 'b', 'EknSetObject'],
        }),
    ];
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Sets.Sets,
            });
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a regular model', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });

        it('queries only sets', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.tags_match_all).toContain('EknSetObject');
        });
    });

    describe('inverse mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Sets.Sets,
                properties: {
                    invert: true,
                }
            });
        });

        it('filters out a set model', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });

        it('queries only non-sets', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_tags).toContain('EknSetObject');
        });
    });
});
