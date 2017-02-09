// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const MockFactory = imports.tests.mockFactory;
const Sets = imports.app.modules.filter.sets;

describe('Filter.Sets', function () {
    const MODELS = [
        Eknc.ContentObjectModel.new_from_props({
            tags: ['a', 'b', 'EknArticleObject'],
        }),
        Eknc.SetObjectModel.new_from_props({
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
    });
});
