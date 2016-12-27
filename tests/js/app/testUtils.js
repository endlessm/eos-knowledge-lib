// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const GObject = imports.gi.GObject;
const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

const BazClass = new Knowledge.Class({
    Name: 'Baz',
    Extends: GObject.Object,
});

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

    describe('get_bem_style_class', function () {
        it('gets style name from knowledge class', function () {
            expect(Utils.get_bem_style_class(BazClass, 'big', '', '')).toEqual('Baz--big');
        });

        it('correctly forms style class name', function () {
            expect(Utils.get_bem_style_class('Foo', 'big', 'bar', 'small')).toEqual('Foo--big__bar--small');
        });

        it('errors if block empty', function () {
            expect(() => Utils.get_bem_style_class('', 'big', 'bar', 'small')).toThrow();
        });

        it('errors if modifying empty element', function () {
            expect(() => Utils.get_bem_style_class('Foo', 'big', '', 'small')).toThrow();
        });

        it('handles empty modifiers', function () {
            expect(Utils.get_bem_style_class('Foo', '', 'bar', '')).toEqual('Foo__bar');
        });

        it('handles empty element', function () {
            expect(Utils.get_bem_style_class('Foo', 'big', '', '')).toEqual('Foo--big');
        });
    });

    describe('get_element_style_class', function () {
        it('gets style name from knowledge class', function () {
            expect(Utils.get_element_style_class(BazClass, 'bar')).toEqual('Baz__bar');
        });

        it('correctly forms style class name', function () {
            expect(Utils.get_element_style_class('Foo', 'bar')).toEqual('Foo__bar');
        });

        it('errors if block or element empty', function () {
            expect(() => Utils.get_element_style_class('Foo', '')).toThrow();
            expect(() => Utils.get_element_style_class('', 'bar')).toThrow();
        });
    });

    describe('get_modifier_style_class', function () {
        it('gets style name from knowledge class', function () {
            expect(Utils.get_modifier_style_class(BazClass, 'bar')).toEqual('Baz--bar');
        });

        it('correctly forms style class name', function () {
            expect(Utils.get_modifier_style_class('Foo', 'bar')).toEqual('Foo--bar');
        });

        it('errors if block or element empty', function () {
            expect(() => Utils.get_modifier_style_class('Foo', '')).toThrow();
            expect(() => Utils.get_modifier_style_class('', 'bar')).toThrow();
        });
    });

    describe('components_from_ekn_id', function () {
        it('can parse EKN IDs without resources', function () {
            let components = Utils.components_from_ekn_id('ekn://domain/hash');
            expect(components).toEqual(['hash']);
        });

        it('can parse EKN IDs with resources', function () {
            let components = Utils.components_from_ekn_id('ekn://domain/hash/resource');
            expect(components).toEqual(['hash', 'resource']);
        });

        it('ignores domains', function () {
            let components = Utils.components_from_ekn_id('ekn:///hash/resource');
            expect(components).toEqual(['hash', 'resource']);
        });
    });
});
