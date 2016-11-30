// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

describe('Utils', function () {
    describe('parallel init', function () {
        it('handles an empty list', function () {
            expect(function () {
                Eknc.utils_parallel_init([], 0, null);
            }).not.toThrow();
        });
    });
});
