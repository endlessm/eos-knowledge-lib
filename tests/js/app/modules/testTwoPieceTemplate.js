// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const TwoPieceTemplate = imports.app.modules.twoPieceTemplate;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Two piece template', function () {
    let module, factory, first, second;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('first', Gtk.Label);
        factory.add_named_mock('second', Gtk.Label);
        factory.add_named_mock('paper-template', TwoPieceTemplate.TwoPieceTemplate, {
            'first': 'first',
            'second': 'second',
        });
        module = factory.create_named_module('paper-template');
        first = factory.get_last_created_named_mock('first');
        second = factory.get_last_created_named_mock('second');
    });

    it('packs its submodules', function () {
        expect(module).toHaveDescendant(first);
        expect(module).toHaveDescendant(second);
    });

    it('gives its submodules the correct CSS classes', function () {
        expect(first).toHaveCssClass('first');
        expect(second).toHaveCssClass('second');
    });
});
