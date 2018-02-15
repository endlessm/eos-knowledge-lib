// Copyright 2018 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const ContentType = imports.app.modules.filter.contentType;
const MockFactory = imports.tests.mockFactory;

describe('Filter.ContentType', function () {
    const MODELS = ['text/html', 'video/real'].map(type =>
        Eknc.ContentObjectModel.new_from_props({
            content_type: type,
        }));
    let filter;

    describe('normal mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: ContentType.ContentType,
                properties: {
                    'content-type': 'video/real',
                },
            });
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a non-video models', function () {
            expect(filter.include(MODELS[0])).toBeFalsy();
            expect(filter.include(MODELS[1])).toBeTruthy();
        });
    });

    describe('invert mode', function () {
        beforeEach(function () {
            [filter] = MockFactory.setup_tree({
                type: ContentType.ContentType,
                properties: {
                    'content-type': 'video/real',
                    invert: true,
                },
            });
        });

        it('filters out a video models', function () {
            expect(filter.include(MODELS[0])).toBeTruthy();
            expect(filter.include(MODELS[1])).toBeFalsy();
        });
    });
});
