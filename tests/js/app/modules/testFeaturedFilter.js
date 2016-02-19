// Copyright 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const FeaturedFilter = imports.app.modules.featuredFilter;

describe('Featured filter', function () {
    const MODELS = [true, false].map(featured =>
        new ContentObjectModel.ContentObjectModel({
            featured: featured,
        }));
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            filter = new FeaturedFilter.FeaturedFilter();
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
            filter = new FeaturedFilter.FeaturedFilter({
                invert: true,
            });
        });

        it('filters out a featured card', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });
    });
});
