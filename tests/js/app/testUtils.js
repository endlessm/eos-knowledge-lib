// Copyright (C) 2015-2016 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const Utils = imports.app.utils;

describe('Utilities:', function () {
    describe('Formatting authors', function () {
        it('yields nothing if no authors', function () {
            expect(Utils.format_authors([])).toEqual('');
        });

        it('formats the correct message for one author', function () {
            expect(Utils.format_authors(['Jane Austen']))
                .toEqual('by Jane Austen');
        });

        it('formats the correct message for more than one author', function () {
            expect(Utils.format_authors([
                'Jane Austen',
                'Henry Miller',
                'William Clifford',
            ])).toEqual('by Jane Austen and Henry Miller and William Clifford');
        });
    });

    describe('Formatting capitals', function () {
        it('yields the same for NONE', function () {
            expect(Utils.format_capitals('fOoBaR',
                EosKnowledgePrivate.TextTransform.NONE)).toEqual('fOoBaR');
        });

        it('capitalizes', function () {
            expect(Utils.format_capitals('fOoBaR',
                EosKnowledgePrivate.TextTransform.UPPERCASE)).toEqual('FOOBAR');
        });
    });
});
