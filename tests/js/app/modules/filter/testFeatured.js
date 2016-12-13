// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Featured = imports.app.modules.filter.featured;
const MockFactory = imports.tests.mockFactory;

describe('Filter.Featured', function () {
    const MODELS = [true, false].map(featured =>
        Eknc.ContentObjectModel.new_from_props({
            featured: featured,
        }));
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter, factory] = MockFactory.setup_tree({
                type: Featured.Featured,
            });
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a non-featured card', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });
    });

    describe('inverse mode', function () {
        beforeEach(function () {
            [filter, factory] = MockFactory.setup_tree({
                type: Featured.Featured,
                properties: {
                    invert: true,
                }
            });
        });

        it('filters out a featured card', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });
    });
});
