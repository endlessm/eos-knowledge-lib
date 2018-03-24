// Copyright 2017 Endless Mobile, Inc.

const {DModel} = imports.gi;

const MockFactory = imports.tests.mockFactory;
const Articles = imports.app.modules.filter.articles;

describe('Filter.Articles', function () {
    const MODELS = [
        new DModel.Content({
            tags: ['a', 'b', 'EknSetObject'],
        }),
        new DModel.Set({
            tags: ['a', 'b', 'EknArticleObject'],
        }),
    ];
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Articles.Articles,
            });
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a regular model', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });

        it('queries only articles', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.tags_match_all).toContain('EknArticleObject');
        });
    });

    describe('inverse mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: Articles.Articles,
                properties: {
                    invert: true,
                }
            });
        });

        it('filters out a set model', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });

        it('queries only non-articles', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_tags).toContain('EknArticleObject');
        });
    });
});
