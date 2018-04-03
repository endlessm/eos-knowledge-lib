// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Featured = imports.app.modules.filter.featured;
const MockFactory = imports.tests.mockFactory;

describe('Filter.Featured', function () {
    const MODELS = [true, false].map(featured => new DModel.Content({featured}));
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
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
            [filter] = MockFactory.setup_tree({
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
