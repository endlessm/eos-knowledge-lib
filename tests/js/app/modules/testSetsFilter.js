// Copyright (C) 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const SetObjectModel = imports.search.setObjectModel;
const SetsFilter = imports.app.modules.setsFilter;

describe('Featured filter', function () {
    const MODELS = [
        new ContentObjectModel.ContentObjectModel({
            tags: ['a', 'b', 'EknArticleObject'],
        }),
        new SetObjectModel.SetObjectModel({
            tags: ['a', 'b', 'EknSetObject'],
        }),
    ];
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            filter = new SetsFilter.SetsFilter();
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
            filter = new SetsFilter.SetsFilter({
                invert: true,
            });
        });

        it('filters out a set model', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });
    });
});
