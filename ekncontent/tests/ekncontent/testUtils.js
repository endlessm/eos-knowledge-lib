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

    describe('get_ekn_version', function () {
        it('should throw an exception when datadir can\'t be found', function () {
            expect(() => Eknc.get_ekn_version("should-not-exist", null)).toThrow();
        });
    });
});
