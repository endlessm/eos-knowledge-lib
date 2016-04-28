// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const PaperTemplate = imports.app.modules.paperTemplate;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Paper Template module', function () {
    let paper_template;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('paper-template', PaperTemplate.PaperTemplate, {
            'content': 'mock-content',
        });
        paper_template = factory.create_named_module('paper-template');
    });

    it('can be constructed', function () {});

    it('has the paper-template CSS class', function () {
        expect(paper_template).toHaveCssClass('paper-template');
    });

    it('has a frame with the content CSS class', function () {
        expect(paper_template).toHaveDescendantWithCssClass(StyleClasses.CONTENT);
    });
});
